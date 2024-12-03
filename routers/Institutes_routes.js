const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  createInstitute,
  loginInstitute,
  addTeacherToInstitute,
  addStudentToInstitute,
  getTestsForInstitute
} = require('../controllers/Institutes_contoller');

// Protect routes with the authentication middleware
router.post('/create',  createInstitute);
router.post('/login', loginInstitute);
router.post('/add-teacher', authenticateToken, addTeacherToInstitute);
router.post('/add-student', authenticateToken, addStudentToInstitute);
router.get('/:instituteId/tests', authenticateToken, getTestsForInstitute);

module.exports = router;
