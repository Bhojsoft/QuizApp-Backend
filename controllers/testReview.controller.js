
const Test = require("../models/Test");
const User = require("../models/user.model");

const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");


const testReviews = async (req, res) => {
    try {
        const userid = req.user.userId;
        const { testid, review, star_count } = req.body;
        const test = await Test.findByIdAndUpdate(testid, {
            $push: {
                reviews: {
                    user_id: userid,
                    review: review,
                    star_count: star_count,
                },
            },
        });

        res
            .status(200)
            .json(new ApiResponse(200, "Review Add success,", test));
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json(new ApiError(500, error.message || "Server Error", error));
    }
};



const getReviewsByCourseId = async (req, res) => {
    const baseUrl = req.protocol + "://" + req.get("host");
    const page = parseInt(req.query.page) || 1; // current page number, defaults to 1
    const limit = parseInt(req.query.limit) || 2; // number of reviews per page, defaults to 2
    const courseid = req.params.id;

    try {
        // Fetch the course by ID but only select the reviews field
        const courseReview = await Course.findById(courseid).select("reviews");

        if (!courseReview) {
            return res.status(404).json(new ApiResponse(404, "Course not found"));
        }

        const totalReviews = courseReview.reviews.length; // Total number of reviews
        const totalPages = Math.ceil(totalReviews / limit);

        // Check if the requested page is within valid range
        if (page > totalPages) {
            return res
                .status(400)
                .json(new ApiResponse(400, `Page ${page} exceeds total pages.`));
        }

        const startIndex = (page - 1) * limit;
        let paginatedReviews = courseReview.reviews
            .reverse()
            .slice(startIndex, startIndex + limit);

        paginatedReviews = await Promise.all(
            paginatedReviews.map(async (review) => {
                const populatedReview = await User.findById(
                    review.user_id,
                  
                );
                return {
                    userid: populatedReview?._id,
                    user_name: `${populatedReview?.name}`,
                  
                    reviewid: review?._id,
                    star_count: review?.star_count,
                    review: review?.review,
                };
            })
        );

        res.status(200).json(
            new ApiResponse(
                200,
                "Course Reviews",
                {
                    courseId: courseReview?._id,
                    reviews: paginatedReviews,
                },
                {
                    currentPage: page,
                    totalPages: totalPages,
                    totalReviews: totalReviews,
                    pageSize: limit,
                }
            )
        );
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json(
                new ApiError(
                    500,
                    error.message || "Error fetching course reviews.",
                    error
                )
            );
    }
};

// const getReviewsByCourseId = asyncHandler(async (req, res) => {
//   const page = req.query.page || 1;
//   const limit = req.query.limit || 2;
//   const courseid = req.params.courseid;

//   const courseReview = await Course.findById(courseid)
//     .select("reviews")
//     .limit(limit)
//   res.status(200).json(
//     new ApiResponse(200, "Course Reviews", {
//       _id: courseReview._id,
//       reviews: courseReview.reviews.reverse(),
//     })
//   );
// });

module.exports = { testReviews };
