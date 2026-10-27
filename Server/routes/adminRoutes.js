const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserRoleStatus);

router.get('/bookings', adminController.getAllBookings);
router.patch('/bookings/:bookingId/status', adminController.updateBookingStatus);

router.get('/reports/occupancy', adminController.getReports);

module.exports = router;
