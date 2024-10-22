const mongoose = require('mongoose');

// Define Question Schema
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

// Define practice Test Schema
const practicetestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type:String, required: true},
  questions: [questionSchema],
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // Reference to Admin who created the test
  description: { type: String },
  totalMarks: { type: Number },
  passingMarks: { type: Number },
}, {
  timestamps: true
});

// Define Test Model
const PracticeTest = mongoose.model('PracticeTest', practicetestSchema);
module.exports = PracticeTest;
