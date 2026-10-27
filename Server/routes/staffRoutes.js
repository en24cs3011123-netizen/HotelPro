const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('staff', 'admin'));

router.get('/lookup', staffController.lookupReservation);
router.post('/check-in', staffController.checkIn);
router.post('/check-out', staffController.checkOut);

module.exports = router;
