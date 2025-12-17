const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Setup file upload for profile pictures
// Store them in uploads/avatars with unique names to avoid conflicts
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    
    // Make sure the avatars folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: avatar-1234567890-987654321.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Keep it under 2MB - profile pics don't need to be huge
  },
  fileFilter: function (req, file, cb) {
    // Only accept common image formats
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Please upload an image file (JPEG, PNG, or GIF)'));
    }
  }
});

// User registration endpoint
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role').optional().isIn(['visitor', 'operator', 'supervisor', 'manager', 'administrator']).withMessage('Invalid role'),
  body('department').optional().trim().isLength({ max: 100 }),
  body('phone').optional().trim().isLength({ max: 20 }),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role, department, phone } = req.body;

    // Check if someone already registered with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'This email is already registered. Try logging in instead?' 
      });
    }

    // Create the new user account with visitor role
    // Admins will assign the actual role later from their dashboard
    const user = new User({
      name,
      email,
      password, // This gets hashed automatically by the User model
      role: 'visitor', // All new users start as visitors
      department,
      phone,
    });

    await user.save();

    // Generate a JWT token that lasts 7 days
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Oops, registration failed:', error);
    res.status(500).json({ 
      message: 'Something went wrong while creating your account. Please try again.' 
    });
  }
});

// User login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    console.log('Login attempt:', { email, hasPassword: !!password });

    // Look up the user by email (include password for verification)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        message: 'Email or password is incorrect' 
      });
    }

    console.log('User found:', { email: user.email, role: user.role, isActive: user.isActive });

    // Check if account is still active
    if (!user.isActive) {
      console.log('Account inactive');
      return res.status(401).json({ 
        message: 'This account has been deactivated. Please contact an administrator.' 
      });
    }

    // Verify the password
    const isPasswordValid = await user.correctPassword(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        message: 'Email or password is incorrect' 
      });
    }

    // All good! Generate a fresh token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ 
      message: 'Something went wrong during login. Please try again.' 
    });
  }
});

// Update user profile (protected route - must be logged in)
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, phone, department, bio } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        message: 'User account not found' 
      });
    }

    // If they're changing their email, make sure it's not already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'This email is already being used by another account' 
        });
      }
      user.email = email;
    }

    // Update the profile fields they sent
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (bio !== undefined) user.bio = bio;

    // Handle new profile picture if they uploaded one
    if (req.file) {
      // Clean up their old avatar to save space
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch (err) {
            // Not a big deal if we can't delete the old one
            console.log('Could not delete old avatar:', err.message);
          }
        }
      }
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ 
      message: 'Could not update your profile. Please try again.' 
    });
  }
});

// Change password (protected route)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide both your current and new password' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password should be at least 6 characters' 
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ 
        message: 'User account not found' 
      });
    }

    // Make sure they got their current password right
    const isPasswordValid = await user.correctPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Save the new password (gets hashed automatically)
    user.password = newPassword;
    await user.save();

    res.json({ 
      message: 'Password changed successfully!' 
    });
  } catch (error) {
    console.error('Password change failed:', error);
    res.status(500).json({ 
      message: 'Could not change your password. Please try again.' 
    });
  }
});

module.exports = router;