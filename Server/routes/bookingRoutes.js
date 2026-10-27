const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createBookingSchema,
  cancelBookingSchema
} = require('../validators/bookingValidators');

// All booking routes require authentication
router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:bookingId', bookingController.getBookingById);
router.patch('/:bookingId', bookingController.updateBooking);
router.post('/:bookingId/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
