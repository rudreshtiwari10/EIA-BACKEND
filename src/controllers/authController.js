const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc      Google OAuth login/signup
// @route     POST /api/auth/google
// @access    Public
exports.googleAuth = asyncHandler(async (req, res, next) => {
  const { credential } = req.body;
  if (!credential) return next(new ErrorResponse('Missing Google credential', 400));

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return next(new ErrorResponse('Invalid Google token', 401));
  }

  const { sub: googleId, email, name, picture } = payload;
  if (!email) return next(new ErrorResponse('Google account has no email', 400));

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: picture || '',
      isVerified: true,
    });
  } else {
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (picture && !user.avatar) { user.avatar = picture; changed = true; }
    if (!user.isVerified) { user.isVerified = true; changed = true; }
    if (changed) await user.save();
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Register user (step 1 — create unverified + send OTP)
// @route     POST /api/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  if (user && !user.isVerified) {
    // Unverified account already exists — update details and re-send OTP
    user.name = name;
    user.password = password;
    if (role) user.role = role;
  } else {
    user = new User({ name, email, password, role, isVerified: false });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpLastSent = Date.now();

  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your Explore Indian Islands account',
      message: `Welcome to Explore Indian Islands!\n\nYour verification OTP is: ${otp}\n\nThis code is valid for 10 minutes.`
    });
    res.status(200).json({ success: true, data: 'OTP sent', email: user.email });
  } catch (err) {
    console.error(err);
    // If user was just created, remove it so the email is free to retry
    if (!user.isVerified && !user.googleId) {
      await User.deleteOne({ _id: user._id });
    }
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc      Verify signup OTP (step 2)
// @route     POST /api/auth/verifysignup
// @access    Public
exports.verifySignup = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorResponse('Please provide email and OTP', 400));
  }

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorResponse('Invalid email or OTP', 400));

  if (user.isVerified) {
    return next(new ErrorResponse('Account already verified — please log in', 400));
  }

  if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
    return next(new ErrorResponse('OTP expired — please request a new one', 400));
  }

  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== user.otp) {
    return next(new ErrorResponse('Invalid OTP', 400));
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpLastSent = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 201, res);
});

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (!user.isVerified) {
    return next(new ErrorResponse('Account not verified. Please complete OTP verification.', 403));
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Update user profile
// @route     PUT /api/auth/updateprofile
// @access    Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'bio', 'location', 'dateOfBirth', 'gender', 'avatar'];
  const fieldsToUpdate = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  }

  // dateOfBirth: '' is invalid for a Date cast; normalize to null
  if (fieldsToUpdate.dateOfBirth === '' || fieldsToUpdate.dateOfBirth === undefined) {
    delete fieldsToUpdate.dateOfBirth;
  }
  if (fieldsToUpdate.dateOfBirth === null) {
    fieldsToUpdate.dateOfBirth = null;
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Find User (Forgot Password) & Send OTP
// @route     POST /api/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and save to database
  user.otp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.otpLastSent = Date.now();

  await user.save({ validateBeforeSave: false });

  // Create reset url (not used here but good for context)
  const message = `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error(err);
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpLastSent = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc      Verify OTP
// @route     POST /api/auth/verifyotp
// @access    Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorResponse('Please provide email and OTP', 400));
  }

  // Get user by email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('Invalid email or OTP', 400));
  }

  // Check if OTP exists and is not expired
  if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  // Hash provided OTP and compare
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  if (hashedOTP !== user.otp) {
    return next(new ErrorResponse('Invalid OTP', 400));
  }

  res.status(200).json({
    success: true,
    data: 'OTP Verified'
  });
});

// @desc      Reset Password
// @route     PUT /api/auth/resetpassword
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return next(new ErrorResponse('Please provide all fields', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid request', 400));
  }

  // Check if OTP is valid (redundant check if verifyOTP was called, but good for security)
  if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  if (hashedOTP !== user.otp) {
    return next(new ErrorResponse('Invalid OTP', 400));
  }

  // Set new password
  user.password = password;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpLastSent = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Resend OTP
// @route     POST /api/auth/resendotp
// @access    Public
exports.resendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Check cooldown (1 minute)
  if (user.otpLastSent) {
    const timeSinceLastSent = Date.now() - user.otpLastSent;
    if (timeSinceLastSent < 60 * 1000) {
      return next(new ErrorResponse('Please wait 1 minute before resending OTP', 400));
    }
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and save to database
  user.otp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.otpLastSent = Date.now();

  await user.save({ validateBeforeSave: false });

  const message = `Your new OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP Resend',
      message
    });

    res.status(200).json({ success: true, data: 'OTP resent' });
  } catch (err) {
    console.error(err);
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpLastSent = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: safeUser,
    });
};
