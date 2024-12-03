// routes/instituteRoutes.js
const express = require('express');
const router = express.Router();
const { createInstitute, addTeacherToInstitute, addStudentToInstitute, getTestsForInstitute } = require('../controllers/instituteController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/create', authenticate, createInstitute);
router.post('/add-teacher', authenticate, addTeacherToInstitute);
router.post('/add-student', authenticate, addStudentToInstitute);
router.get('/:instituteId/tests', authenticate, getTestsForInstitute);

module.exports = router;
