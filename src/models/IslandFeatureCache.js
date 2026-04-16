const mongoose = require('mongoose');

const IslandFeatureCacheSchema = new mongoose.Schema({
  islandName: { type: String, required: true, index: true },
  featureType: { type: String, required: true, index: true },
  features: { type: Array, default: [] },
  fetchedAt: { type: Date, default: Date.now },
});

IslandFeatureCacheSchema.index({ islandName: 1, featureType: 1 }, { unique: true });

module.exports = mongoose.model('IslandFeatureCache', IslandFeatureCacheSchema);
