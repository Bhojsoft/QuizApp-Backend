const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/authMiddleware'); // Assuming you have authentication middleware
const upload = require('../middlewares/multerConfig');

// Route for user registration
router.post('/register', userController.registerUser);

// Route for user login
router.post('/login', userController.loginUser);

// Route to get user profile (protected route)
router.get('/profile', authenticate, userController.getProfile);

// Route to update user information (protected route)
router.patch('/:userId', authenticate, upload.single("profile_image"), userController.updateUser);

// Route to get all tests
router.get('/alltests', userController.getAllTests);


// Controller to get testId(s) from testsTaken for a specific user only submited test 
router.get('/user/:userId/tests',userController.getUserWithTests);


// Middleware for checking student role (this should be expanded in practice)
const isStudent = async (req, res, next) => {
  // This is a placeholder; you'd typically verify the role from the request or token
  if (req.body.role !== 'student') {
    return res.status(403).send('Access denied. Only students can perform this action.');
  }
  next();
};



// Student routes
// get  tests by subject
// router.get('/tests/count',userController.getTestCountBySubject);

// to get topics and quizzes by subject name
// router.get('/tests/subject/:subject', userController.getTopicsAndQuizzesBySubject);


// Get a specific test details
router.get('/test/:id', userController.getTest);

// Get a specific test Quiz
router.get('/test/question/:id', userController.getTestQuiz);

      //test score 
router.post('/test/:id/submit', userController.submitTest);

// Route to get practice tests by subject name
router.get('/practicetests/subject/:subject', userController.getPracticeTestsBySubject);

// Route to calculate and display the score of a practice test
router.post('/practicetests/:testId/score', userController.calculatePracticeTestScore);

// filter userscore
router.get('/top-users', userController.getTopUsersByAverageScore);

module.exports = router;
