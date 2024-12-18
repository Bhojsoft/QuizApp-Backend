const express = require("express");
const router = express.Router();
const Course = require("../models/course.model");
const multer = require("multer");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const registration = require("../models/admin");
const NotificationModel = require("../models/notification.model");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
});

router.get("/", async (req, res, next) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const skip = (page - 1) * limit;

    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .limit(limit)
      .skip(skip);

    const coursesWithFullImageUrls = courses.map((course) => ({
      _id: course?._id,
      course_name: course?.course_name || "",
      online_offline: course?.online_offline || "",
      course_rating: "",
      course_duration: Math.floor(
        Math.round(
          ((course?.end_date - course?.start_date) / (1000 * 60 * 60 * 24 * 7)) *
          100
        ) / 100
      ),
      course_price: course?.price || "",
      course_offer_prize: course?.offer_prize || "",
      thumbnail_image: course?.thumbnail_image
        ? `${baseUrl}/${course?.thumbnail_image?.replace(/\\/g, "/")}`
        : "",
      createdBy: course?.createdBy?.name || "",
    }));

    const totalCourses = await Course.countDocuments();
    const totalPages = Math.ceil(totalCourses / limit);

    res.status(200).json({
      courses: coursesWithFullImageUrls,
      currentPage: page,
      totalPages,
      totalCourses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiError(500, err.message || "Server Error", err));
  }
});

router.post(
  "/", authenticateToken,
  upload.fields([
    { name: "thumbnail_image", maxCount: 1 },
  ]),
  authenticateToken,
  async (req, res) => {
    const course = new Course({
      course_name: req.body.course_name,
      online_offline: req.body.online_offline,
      price: req.body.price,
      offer_prize: req.body.offer_prize,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      tags: req.body.tags,
      course_brief_info: req.body.course_brief_info,
      course_brief_info: req.body.course_brief_info,
      course_information: req.body.course_information,
      thumbnail_image: req.files["thumbnail_image"]
        ? req.files["thumbnail_image"][0].path
        : "",
      createdBy: req.user.userId
    });

    try {
      const savedCourse = await course.save();

      const trainerId = req.user.id;

      await registration.findByIdAndUpdate(
        trainerId,
        {
          $addToSet: {
            categories: savedCourse?.category_id,
          },
        },
        { new: true }
      );

      const notification = new NotificationModel({
        recipient: req.user.userId,
        message: `Your course "${savedCourse.course_name}" has been created successfully.`,
        activityType: "COURSE_CREATE",
        relatedId: savedCourse._id,
      });
      await notification.save();
      res
        .status(200)
        .json(new ApiResponse(200, "Course Added Successfully", savedCourse));
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json(new ApiError(500, err.message || "Server Error", err));
    }
  }
);

// ========================= course/:id ====================================
router.get("/:id", async (req, res, next) => {
  const baseUrl = req.protocol + "://" + req.get("host");

  try {
    const courseData = await Course.findById(req.params.id)
      .populate("createdBy", "name email")

    if (!courseData) {
      return res
        .status(404)
        .json(new ApiError(404, "Course not found", "Invalid course ID"));
    }

    const reviews = courseData.reviews;
    const totalStars = reviews.reduce(
      (sum, review) => sum + review.star_count,
      0
    );
    const averageRating = totalStars / reviews.length;

    const courseWithFullImageUrls = {
      _id: courseData?._id,
      course_name: courseData?.course_name || "",
      course_brief_info: courseData?.course_brief_info || "",
      course_information: courseData?.course_information || "",
      online_offline: courseData?.online_offline || "",
      thumbnail_image: courseData?.thumbnail_image
        ? `${baseUrl}/${courseData?.thumbnail_image.replace(/\\/g, "/")}`
        : "",
      start_date: courseData?.start_date || "",
      end_date: courseData?.end_date || "",
      start_time: courseData?.start_time || "",
      end_time: courseData?.end_time || "",
      course_rating: averageRating || "",
      course_duration: Math.floor(
        Math.round(
          ((courseData?.end_date - courseData?.start_date) /
            (1000 * 60 * 60 * 24 * 7)) *
          100
        ) / 100
      ),
      price: courseData?.price || "",
      tags: courseData?.tags || "",
      offer_prize: courseData?.offer_prize || "",
      course_flag: courseData?.trainer_id?.role || "",
      createdBy: courseData?.createdBy?.name || "",
    };

    res.status(200).json(courseWithFullImageUrls);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json(new ApiError(500, "Server Error", err));
  }
});

router.put(
  "/:id",
  upload.fields([
    { name: "thumbnail_image", maxCount: 1 },
  ]),
  authenticateToken,
  async (req, res) => {
    const courseId = req.params.id;

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }
    const updateData = {
      course_name: req.body.course_name || existingCourse.course_name,
      online_offline: req.body.online_offline || existingCourse.online_offline,
      price: req.body.price || existingCourse.price,
      offer_prize: req.body.offer_prize || existingCourse.offer_prize,
      start_date: req.body.start_date || existingCourse.start_date,
      end_date: req.body.end_date || existingCourse.end_date,
      start_time: req.body.start_time || existingCourse.start_time,
      end_time: req.body.end_time || existingCourse.end_time,
      tags: req.body.tags || existingCourse.tags,
      course_brief_info: req.body.course_brief_info || existingCourse.course_brief_info,
      course_information: req.body.course_information || existingCourse.course_information,
      thumbnail_image: req?.files["thumbnail_image"]
        ? req.files["thumbnail_image"][0].path
        : existingCourse.thumbnail_image, // Keep existing image if no new image
    };

    try {
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedCourse) {
        return res.status(404).json(new ApiError(404, "Course not found"));
      }

      const notification = new NotificationModel({
        recipient: req.user.userId,
        message: `Your course "${updatedCourse.course_name}" has been updated successfully.`,
        activityType: "COURSE_UPDATE",
        relatedId: updatedCourse._id,
      });

      await notification.save();

      const attendees = updatedCourse.registered_users;

      if (attendees) {
        const notifications = attendees?.map((attendee) => ({
          recipient: attendee,
          message: `The course "${updatedCourse.course_name}" has been updated.`,
          activityType: "COURSE_UPDATE",
          relatedId: updatedCourse._id,
        }));
        await NotificationModel.insertMany(notifications);
      }

      res
        .status(200)
        .json(
          new ApiResponse(200, "Course updated successfully", updatedCourse)
        );
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json(new ApiError(500, err.message || "Server Error", err));
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const data = await Course.deleteOne({ _id: req.params.id });
    if (!data.deletedCount) res.status(400).json({ msg: "Not Found" });
    else {
      res
        .status(200)
        .json({ msg: "Course data successfully deleted", result: data });
    }
  } catch (error) {
    res.status(500).json({ error: error });
  }
});


// delete couse
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    await Course.deleteOne({ _id: req.params.id });

    const attendees = course.registered_users;

    const notifications = attendees.map((attendee) => ({
      recipient: attendee,
      message: `The course "${course.course_name}" has been deleted.`,
      notificationType: "COURSE_DELETE",
      course: course._id,
    }));
    await notifications.save();

    const notification = new NotificationModel({
      recipient: req.user.userId,
      message: `Your course "${deletedCourse.course_name}" has been deleted successfully.`,
      activityType: "COURSE_DELETE",
      relatedId: deletedCourse._id,
    });

    await notification.save();

    res.status(200).json({
      message: "Course deleted successfully and notifications sent.",
    });
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message || "Server Error"));
  }
});



module.exports = router;
