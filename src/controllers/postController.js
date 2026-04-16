const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const populatePost = (q) => q
  .populate('user', 'name avatar')
  .populate('island', 'name')
  .populate('comments.user', 'name avatar')
  .populate('comments.replies.user', 'name avatar');

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
  const populated = await populatePost(Post.findById(post._id));
  res.status(201).json({ success: true, data: populated });
});

exports.getAllPosts = asyncHandler(async (req, res) => {
  const posts = await populatePost(Post.find().sort({ createdAt: -1 }).limit(100));
  res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.getPostById = asyncHandler(async (req, res, next) => {
  const post = await populatePost(Post.findById(req.params.id));
  if (!post) return next(new ErrorResponse('Post not found', 404));
  res.status(200).json({ success: true, data: post });
});

exports.getPostsByUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select('name email bio location avatar createdAt followers following');
  if (!user) return next(new ErrorResponse('User not found', 404));
  const posts = await populatePost(Post.find({ user: req.params.userId }).sort({ createdAt: -1 }));
  res.status(200).json({ success: true, data: { user, posts } });
});

exports.getPostsByIsland = asyncHandler(async (req, res) => {
  const posts = await populatePost(Post.find({ island: req.params.islandId }).sort({ createdAt: -1 }));
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

exports.toggleLike = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const uid = req.user._id.toString();
  const idx = post.likes.findIndex(x => x.toString() === uid);
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(req.user._id);
  await post.save();
  res.status(200).json({ success: true, data: { likes: post.likes.length, liked: idx < 0 } });
});

exports.addComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  if (!text || !text.trim()) return next(new ErrorResponse('Comment text required', 400));
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  post.comments.push({ user: req.user._id, text: text.trim() });
  await post.save();
  const populated = await populatePost(Post.findById(post._id));
  res.status(201).json({ success: true, data: populated });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const c = post.comments.id(req.params.commentId);
  if (!c) return next(new ErrorResponse('Comment not found', 404));
  if (c.user.toString() !== req.user._id.toString() && post.user.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }
  c.deleteOne();
  await post.save();
  res.status(200).json({ success: true });
});

exports.addReply = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  if (!text || !text.trim()) return next(new ErrorResponse('Reply text required', 400));
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const c = post.comments.id(req.params.commentId);
  if (!c) return next(new ErrorResponse('Comment not found', 404));
  c.replies.push({ user: req.user._id, text: text.trim() });
  await post.save();
  const populated = await populatePost(Post.findById(post._id));
  res.status(201).json({ success: true, data: populated });
});

exports.deleteReply = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  const c = post.comments.id(req.params.commentId);
  if (!c) return next(new ErrorResponse('Comment not found', 404));
  const r = c.replies.id(req.params.replyId);
  if (!r) return next(new ErrorResponse('Reply not found', 404));
  if (r.user.toString() !== req.user._id.toString() && post.user.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }
  r.deleteOne();
  await post.save();
  res.status(200).json({ success: true });
});
