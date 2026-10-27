const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

module.exports = router;
