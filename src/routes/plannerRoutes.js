const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getAccommodations,
  getActivities,
  finalize,
  searchHotel,
  getIslandFeatureData,
} = require('../controllers/plannerController');

// All planner routes are public (guests can plan too)
router.post('/routes', getRoutes);
router.post('/accommodations', getAccommodations);
router.post('/activities', getActivities);
router.post('/finalize', finalize);
router.post('/search-hotel', searchHotel);
router.post('/feature', getIslandFeatureData);

module.exports = router;
