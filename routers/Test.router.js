const express = require('express');
const router = express.Router();
const testController = require('../controllers/Test.controller');
const { authenticate } = require('../middlewares/authMiddleware');
const Question = require('../models/question.model');

const instituteController = require('../controllers/Institutes_contoller.js'); // Adjust the path as needed


// Route to create a new test
router.post('/', authenticate, testController.createTest);

// Route to get all approved tests
router.get('/', testController.getTests);

// Route to approve a specific test by testId
router.patch('/approve/:testId', authenticate, testController.approveTest);

// Route to count tests created by an institute
router.get('/count/:instituteId', testController.countTestsByInstitute);

// Route to aggregate test details by an institute
router.get('/institute/:instituteId/tests/aggregate', testController.aggregateTestsByInstitute);

// Count tests for all institutes
router.get('/tests/count/all', instituteController.countTestsForAllInstitutes);


module.exports = router;
