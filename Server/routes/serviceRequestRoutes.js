const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.post('/', serviceRequestController.createRequest);
router.get('/', serviceRequestController.getRequests);
router.patch('/:id/status', authorize('staff', 'admin'), serviceRequestController.updateRequestStatus);

module.exports = router;
