const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    pin_code: { type: String },
    city: { type: String },
    state: { type: String },
    country: { String },
    college_name: { type: String },
    experience: { type: String },
    class: { type: String},
    profile_image: String,
    testsTaken: [{
        testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
        score: Number,
    }]
});

// Pre-save middleware to hash passwords
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
