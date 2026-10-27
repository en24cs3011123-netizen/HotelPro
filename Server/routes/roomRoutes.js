const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  roomCreateSchema,
  roomUpdateSchema,
  availabilityQuerySchema
} = require('../validators/roomValidators');

// Public endpoints
router.get('/availability', validate(availabilityQuerySchema), roomController.checkAvailability);
router.get('/', roomController.getRooms);
router.get('/:roomId', roomController.getRoomById);

// Protected endpoints
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(roomCreateSchema),
  roomController.createRoom
);

router.patch(
  '/:roomId',
  authenticate,
  authorize('admin', 'staff'),
  validate(roomUpdateSchema),
  roomController.updateRoom
);

router.delete('/:roomId', authenticate, authorize('admin'), roomController.deleteRoom);

module.exports = router;
