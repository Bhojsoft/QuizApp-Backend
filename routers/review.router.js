const express = require('express');
const router = express.Router();
const authenticate =require("../middlewares/authMiddleware")

const {getReviewsByCourseId, courseReviews} = require("../controllers/courseReview.controller")

router.get('/getReviewsByCourseId',getReviewsByCourseId);


router.post('/courseReviews',authenticate, courseReviews);









module.exports = router;