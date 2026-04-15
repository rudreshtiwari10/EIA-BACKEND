const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, maxlength: 500, default: '' },
  island: { type: mongoose.Schema.Types.ObjectId, ref: 'Island', default: null },
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
