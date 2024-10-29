const Course = require("../models/course.model");
const User = require("../models/user.model");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");



// Controller to Search Courses by Name
const searchCourseByName = async (req, res) => {
  const baseUrl = req.protocol + "://" + req.get("host");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  try {
    const { course_name } = req.query;

    if (!course_name) {
      return res.status(400).json(new ApiError(400, "Course name is required"));
    }

    const totalCourses = await Course.countDocuments({
      course_name: { $regex: course_name, $options: "i" },
    });
    const courses = await Course.find({
      course_name: { $regex: course_name, $options: "i" }, // 'i' makes it case-insensitive
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    if (!courses || courses.length === 0) {
      return res.status(404).json(new ApiResponse(404, "No courses found"));
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "Courses found",
        courses.map((course) => {
          return {
            _id: course?._id,
            course_name: course?.course_name || "",
            online_offline: course?.online_offline || "",
            thumbnail_image: course?.thumbnail_image
              ? `${baseUrl}/${course?.thumbnail_image?.replace(/\\/g, "/")}`
              : "",
            course_rating: "",
            course_duration: Math.floor(
              Math.round(
                ((course?.end_date - course?.start_date) /
                  (1000 * 60 * 60 * 24 * 7)) *
                  100
              ) / 100
            ),
            course_price: course?.price || "",
            course_offer_prize: course?.offer_prize || "",
            course_flag: course?.trainer_id?.role || "",
          };
        }),
        {
          currentPage: page,
          totalPages: Math.ceil(totalCourses / limit),
          totalItems: totalCourses,
          pageSize: limit,
        }
      )
    );
  } catch (error) {
    console.error("Error searching for course:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Error while searching for course", error));
  }
};



const searchUserByName = async (req, res) => {
    const baseUrl = req.protocol + "://" + req.get("host");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: "User name is required" });
        }

        // Aggregation pipeline to search for users by name and ensure they have taken tests
        const users = await User.aggregate([
            // Match users by name and ensure testsTaken array is not empty
            {
                $match: {
                    name: { $regex: name, $options: "i" }, // Case-insensitive search
                    testsTaken: { $exists: true, $not: { $size: 0 } } // Only users with testsTaken
                }
            },
            // Unwind the testsTaken array to calculate the average score
            { $unwind: "$testsTaken" },
            // Group by user ID and calculate the average score for each user
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    email: { $first: "$email" },
                    profile_image: { $first: "$profile_image" },
                    averageScore: { $avg: "$testsTaken.score" } // Calculate the average score
                }
            },
            // Sort users by creation date (most recent first)
            { $sort: { createdAt: -1 } },
            // Pagination: Skip and Limit
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);

        // Count total number of users for pagination
        const totaluser = await User.countDocuments({
            name: { $regex: name, $options: "i" },
            testsTaken: { $exists: true, $not: { $size: 0 } }
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found who have taken tests" });
        }

        res.status(200).json({
            success: true,
            message: "Users found",
            data: users.map((user) => {
                return {
                    _id: user._id,
                    name: user?.name || "",
                    email: user?.email || "",
                    profile_image: user?.profile_image || "",
                    averageScore: user?.averageScore || 0 // Include average score
                };
            }),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totaluser / limit),
                totalItems: totaluser,
                pageSize: limit,
            }
        });
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({
            success: false,
            message: "Error while searching for users",
            error: error.message
        });
    }
};


module.exports = {
  searchCourseByName,searchUserByName
};
