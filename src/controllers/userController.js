const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

exports.toggleFollow = asyncHandler(async (req, res, next) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return next(new ErrorResponse('You cannot follow yourself', 400));
  }
  const target = await User.findById(targetId);
  if (!target) return next(new ErrorResponse('User not found', 404));

  const me = await User.findById(req.user._id);
  const isFollowing = me.following.some(id => id.toString() === targetId);

  if (isFollowing) {
    me.following = me.following.filter(id => id.toString() !== targetId);
    target.followers = target.followers.filter(id => id.toString() !== req.user._id.toString());
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
  }
  await me.save();
  await target.save();

  res.status(200).json({
    success: true,
    data: {
      following: !isFollowing,
      followersCount: target.followers.length,
      followingCount: target.following.length,
    },
  });
});

exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorResponse('Image required', 400));
  const user = await User.findById(req.user._id);
  if (user.avatar && user.avatar.startsWith('/uploads/')) {
    const old = path.join(__dirname, '..', '..', user.avatar);
    fs.unlink(old, () => {});
  }
  user.avatar = `/uploads/${req.file.filename}`;
  await user.save();
  res.status(200).json({ success: true, data: user });
});
