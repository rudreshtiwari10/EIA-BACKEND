const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

exports.createPost = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorResponse('Image is required', 400));
  const imageUrl = `/uploads/${req.file.filename}`;
  const { caption, island } = req.body;
  const post = await Post.create({
    user: req.user._id,
    imageUrl,
    caption: caption || '',
    island: island || null,
  });
  const populated = await Post.findById(post._id)
    .populate('user', 'name avatar')
    .populate('island', 'name');
  res.status(201).json({ success: true, data: populated });
});

exports.getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name avatar')
    .populate('island', 'name');
  res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.getPostsByUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId).select('name email bio location avatar createdAt');
  if (!user) return next(new ErrorResponse('User not found', 404));
  const posts = await Post.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .populate('island', 'name');
  res.status(200).json({ success: true, data: { user, posts } });
});

exports.getPostsByIsland = asyncHandler(async (req, res) => {
  const posts = await Post.find({ island: req.params.islandId })
    .sort({ createdAt: -1 })
    .populate('user', 'name avatar');
  res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  if (post.user.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }
  await post.deleteOne();
  res.status(200).json({ success: true });
});
