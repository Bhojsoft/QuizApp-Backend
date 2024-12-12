const express = require('express');
const router = express.Router();
const testController = require('../controllers/Test.controller');
const { authenticate } = require('../middlewares/authMiddleware');
const { getTests } = require('../controllers/Test.controller');
const Question = require('../models/question.model');
const { createTestByTeacher } = require('../controllers/Test.controller.js');
const { verifyToken } = require('../middlewares/authMiddleware');

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

//Route to fetch tests
router.get('/tests', authenticate, getTests);

// Endpoint to create a test
//router.post('/teacher/create', verifyToken, createTestByTeacher);


module.exports = router;
