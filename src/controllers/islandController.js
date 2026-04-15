const Island = require('../models/Island');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all islands
// @route   GET /api/islands
// @access  Public
exports.getAllIslands = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from filtering
  const removeFields = ['select', 'sort', 'page', 'limit', 'name'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Advanced Filtering (Supports gt, gte, in, etc.)
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  let query = Island.find(JSON.parse(queryStr));

  // Name search: apply clean case-insensitive regex (separate from general filter)
  if (req.query.name) {
    query = query.find({ name: { $regex: req.query.name, $options: 'i' } });
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 200;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Island.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const islands = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({ success: true, count: islands.length, pagination, data: islands });
});

// @desc    Get single island
// @route   GET /api/islands/:id
// @access  Public
exports.getIsland = asyncHandler(async (req, res, next) => {
  const island = await Island.findById(req.params.id);

  if (!island) {
    return next(new ErrorResponse(`Island not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: island });
});

// @desc    Create new island
// @route   POST /api/islands
// @access  Private
exports.createIsland = asyncHandler(async (req, res, next) => {
  const island = await Island.create(req.body);
  res.status(201).json({ success: true, data: island });
});

// @desc    Update island
// @route   PUT /api/islands/:id
// @access  Private
exports.updateIsland = asyncHandler(async (req, res, next) => {
  let island = await Island.findById(req.params.id);

  if (!island) {
    return next(new ErrorResponse(`Island not found with id of ${req.params.id}`, 404));
  }

  island = await Island.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: island });
});

// @desc    Delete island
// @route   DELETE /api/islands/:id
// @access  Private
exports.deleteIsland = asyncHandler(async (req, res, next) => {
  const island = await Island.findById(req.params.id);

  if (!island) {
    return next(new ErrorResponse(`Island not found with id of ${req.params.id}`, 404));
  }

  await island.deleteOne();

  res.status(200).json({ success: true, data: {} });
});