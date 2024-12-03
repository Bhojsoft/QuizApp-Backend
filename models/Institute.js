const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const instituteSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
    default: () => uuidv4(), // Generates a UUID
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  isApproved: { type: Boolean, default: false },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
});

// Export the Institute model with the custom `id` field
module.exports = mongoose.model('Institute', instituteSchema);
