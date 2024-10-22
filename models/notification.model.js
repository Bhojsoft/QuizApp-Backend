const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "Registration",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  activityType: {
    type: String,
    enum: [
      "COURSE_ENROLLMENT",
      "COURSE_UPDATE",
      "COURSE_CREATE",
      "REGISTRATION_SUCCESS",
      "LOGIN_SUCCESS",
      "ROLE_CHANGE_APPROVED",
      "PROFILE_UPDATED",
      "ROLE_CHANGE_REJECTED",
      "TEST_SUBMIT",
      "OTHER",
    ],
    required: true,
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  isSeen: {
    type: Boolean,
    default: false,
  },
  seenAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
