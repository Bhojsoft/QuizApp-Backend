const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Add password field
  role: { 
    type: String, 
    required: true, 
    enum: ['main-admin', 'sub-admin'], // Add the roles you want to support
    default: 'sub-admin' // Set a default value if needed
  },
  institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  testsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  admin_image: { type: String, required: true }
});

// Middleware to hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords during login
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
