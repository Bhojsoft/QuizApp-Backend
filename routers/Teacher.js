const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher_controller.js');
const { createTest } = require('../controllers/teacher_controller.js');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authenticate, authenticateRole } = require('../middlewares/authMiddleware'); 


// Route for registering a teacher
router.post('/register', teacherController.registerTeacher);
// Teacher login
router.post('/login', teacherController.loginTeacher);


// Route for getting teachers by institute
router.get('/:instituteId/teachers', teacherController.getTeachersByInstitute);
router.post('/create-test', authenticate, authenticateRole(['Teacher', 'institute']), createTest);


  
// Apply the middleware to routes that require authentication
//router.post('/create-test', verifyToken, createTestByTeacher);



module.exports = router;
