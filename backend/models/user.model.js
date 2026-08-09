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
    index: true,
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
    unique: true,
    sparse: true, 
    index: true, 
  },
  picture: {
    type: String,
  }
}, { 
  timestamps: true 
});

// Single field indexes for high-speed queries by _id, email, and googleId
userSchema.index({ _id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);