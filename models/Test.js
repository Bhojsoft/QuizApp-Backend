// models/test.model.js
const mongoose = require('mongoose');
const Question = require('./question.model'); // Import the Question model

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], 
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  description: { type: String },
  test_image: { type: String },
  totalMarks: { type: Number },
  passingMarks: { type: Number },
  sample_question: { type: String },
  views: { type: Number, default: 0 },
  visibility: {
    type: String,
    enum: ['all', 'institute'],
    default: 'all'
  },
 // Reference to Question model
  institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }]
}, {
  timestamps: true
});

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
