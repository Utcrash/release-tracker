const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    // required for local users, not for Google users
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // allow multiple nulls for local users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  passwordHash: {
    type: String,
    // required for local users, not for Google users
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    required: true
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User; 