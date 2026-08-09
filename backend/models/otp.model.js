const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: [true, 'Email ID is required'],
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  type: {
    type: String,
    required: [true, 'OTP type is required'],
    enum: ['login', 'register', 'forget_password', 'forgot'], 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes expiry
  }
});

// Compound index for fast email + type lookups
otpSchema.index({ emailId: 1, type: 1 });

module.exports = mongoose.model('Otp', otpSchema);