const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    index: true, // Explicit B-tree index for high-speed lookups
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    // Password is only required if the user did not sign up via Google
    required: [
      function () {
        return !this.googleId;
      },
      'Password is required for email registration'
    ],
    // Prevents password from being exposed in standard database queries
    select: false, 
  },
  googleId: {
    type: String,
    sparse: true, 
  },
  picture: {
    type: String,
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);