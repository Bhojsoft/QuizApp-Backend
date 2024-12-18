const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authenticate, authenticateRole } = require('../middlewares/authMiddleware'); 
const Institute = require('../models/Institute');
// Adjust the path as needed

const {
  createInstitute,
  loginInstitute,
  addTeacherToInstitute,
  addStudentToInstitute,
  getTestsForInstitute,
} = require('../controllers/Institutes_contoller');
const { createTest } = require('../controllers/Institutes_contoller.js');
const instituteController = require('../controllers/Institutes_contoller.js'); 
const instituteControl = require('../controllers/Institutes_contoller.js'); 
 // Use the function directly
 // Import the createTest controller
const multer = require('multer');
const upload = require('../middlewares/multerConfig');
const instituteControllertest = require('../controllers/Institutes_contoller.js'); 
const { approveTeacher } = require('../controllers/Institutes_contoller.js');



// Protect routes with the authentication middleware
router.post('/create',  createInstitute);
router.post('/login', loginInstitute);
router.post('/add-teacher', authenticateToken, addTeacherToInstitute);
router.post('/add-student', authenticateToken, addStudentToInstitute);
router.get('/:instituteId/tests', authenticateToken, getTestsForInstitute);
router.post(
  '/create-test',
  authenticateToken,
  authenticateRole(['main-admin', 'sub-admin',"institute"]),
  (req, res) => {
    createTest(req, res);
  }
);

// Count tests for all institutes
router.get('/tests/count/all', instituteController.countTestsForAllInstitutes);

//Get all student in that institues has
router.get('/institute/:instituteId/students', instituteControl.getStudentsByInstitute);

//Route to get test details for a specific institute
router.get('/institute/:instituteId/tests', instituteControllertest.aggregateTestsByInstitute);

// Approve teacher route
router.put('/approve-teacher', authenticateToken, approveTeacher);

// GET all institutes (only name and id)
router.get('/api/institutes', async (req, res) => {
  try {
      const institutes = await Institute.find({}, { id: 1, name: 1 });  // Only fetch id and name fields
      res.status(200).json(institutes);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching institutes.' });
  }
});



 // Create a new test
// router.get('/', authenticateToken, getTests); // Get all approved tests
// router.get('/:id', authenticateToken, getTestById); // Get test by ID
// router.patch('/:testId/approve', authenticateToken, approveTest); // Approve a test
// router.put('/:id', authenticateToken, updateTest); // Update a test
// router.delete('/:id', authenticateToken, deleteTest); // Delete a test

module.exports = router;
