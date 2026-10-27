const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authenticate = require('../middleware/authenticate');

// Public route to view reviews
router.get('/hotel/:hotelId', reviewController.getHotelReviews);

// Protected route to create review (stay must be checked_out)
router.post('/', authenticate, reviewController.createReview);

module.exports = router;
