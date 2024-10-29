const express = require('express');
const router = express.Router();
const practiceTestController = require('../controllers/practicetest.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Route to create a new practice test
router.post('/create', authenticateToken, practiceTestController.createPracticeTest);

// Route to get all practice tests
router.get('/', authenticateToken, practiceTestController.getAllPracticeTests);

// Route to get a single practice test by ID
router.get('/:id',authenticateToken, practiceTestController.getPracticeTestById);

// Route to update a practice test
router.put('/:id',authenticateToken, practiceTestController.updatePracticeTest);

// Route to delete a practice test
router.delete('/:id',authenticateToken, practiceTestController.deletePracticeTest);

module.exports = router;