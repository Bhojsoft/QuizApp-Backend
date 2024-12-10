const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher_controller.js');

// Route for registering a teacher
router.post('/register', teacherController.registerTeacher);
// Teacher login
router.post('/login', teacherController.loginTeacher);


// Route for getting teachers by institute
router.get('/:instituteId/teachers', teacherController.getTeachersByInstitute);

module.exports = router;
