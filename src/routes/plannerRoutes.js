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
const { protect } = require('../middleware/auth');

// Public — anyone browsing an island can see its hotels/restaurants/etc.
router.post('/feature', getIslandFeatureData);

// Trip planning requires a logged-in user
router.post('/routes', protect, getRoutes);
router.post('/accommodations', protect, getAccommodations);
router.post('/activities', protect, getActivities);
router.post('/finalize', protect, finalize);
router.post('/search-hotel', protect, searchHotel);

module.exports = router;
