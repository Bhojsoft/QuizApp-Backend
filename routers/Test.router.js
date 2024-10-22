const express = require('express');
const router = express.Router();
const testController = require('../controllers/Test.controller');
const { authenticate } = require('../middlewares/authMiddleware');

// Route to create a new test
router.post('/', authenticate, testController.createTest);

// Route to get all approved tests
router.get('/', testController.getTests);

// Route to approve a specific test by testId
router.patch('/approve/:testId', authenticate, testController.approveTest);

module.exports = router;
