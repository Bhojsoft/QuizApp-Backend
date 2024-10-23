const express = require('express');
const router = express.Router();
const {authenticate} =require("../middlewares/authMiddleware")

// const {getReviewsByCourseId, courseReviews} = require("../controllers/courseReview.controller")

// router.get('/getReviewsByCourseId',getReviewsByCourseId);


// router.post('/courseReviews',authenticate, courseReviews);


const { courseReviews, getReviewsByCourseId } = require('../controllers/courseReview.controller'); // Ensure the correct path

router.post('/add-review',authenticate,courseReviews); // This is the correct usage
 

router.get('/:id',getReviewsByCourseId);









module.exports = router;