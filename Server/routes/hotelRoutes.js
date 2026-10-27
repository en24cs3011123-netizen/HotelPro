const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { hotelCreateSchema, hotelUpdateSchema } = require('../validators/roomValidators');

// Public endpoints
router.get('/', hotelController.getHotels);
router.get('/:hotelId', hotelController.getHotelById);

// Protected Administrator endpoints
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(hotelCreateSchema),
  hotelController.createHotel
);

router.patch(
  '/:hotelId',
  authenticate,
  authorize('admin'),
  validate(hotelUpdateSchema),
  hotelController.updateHotel
);

router.delete('/:hotelId', authenticate, authorize('admin'), hotelController.deleteHotel);

module.exports = router;
