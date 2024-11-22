const mongoose = require('mongoose');
const reviewSchema = require("./review.model");
// Define Question Schema
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

// Define Test Schema
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  questions: [questionSchema],
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // Reference to Admin who created the test
  description: { type: String },
  test_image: { type: String },
  totalMarks: { type: Number },
  passingMarks: { type: Number },
  sample_question:{type: String},
  views: { type: Number, default: 0 }, // Popularity metric
  reviews: [reviewSchema],
}, {
  timestamps: true
});

// Define Test Model
const Test = mongoose.model('Test', testSchema);
module.exports = Test;
