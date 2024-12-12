const mongoose = require('mongoose');

const testSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      answer: { type: String, required: true },
    },
  ],
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number },
  correctAnswers: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TestSubmission', testSubmissionSchema);
