const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema - defines what data we store for each user
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // each user needs a unique email
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['visitor', 'operator', 'supervisor', 'manager', 'administrator'],
    default: 'visitor', // New users start as visitors until admin assigns a role
  },
  assignedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }], // Sites this user has access to (operators, supervisors)
  department: String,
  phone: String,
  avatar: String, // Profile picture filename
  bio: String, // Short description/about section
  isActive: {
    type: Boolean,
    default: true, // New users are active by default
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash if password was actually modified
  if (!this.isModified('password')) return next();
  
  // Hash with 12 rounds (good balance of security and speed)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check if provided password matches stored hash
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);