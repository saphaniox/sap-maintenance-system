const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin, isManagerOrAdmin } = require('../middleware/permissions');

// Get user statistics (admin only) - MUST BE BEFORE /:id route
router.get('/stats/overview', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get site count
    const Site = require('../models/Site');
    const totalSites = await Site.countDocuments();
    
    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      totalSites,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin/manager only)
router.get('/', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    
    const query = {};
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('assignedSites', 'name code type')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user by ID (admin/manager only)
router.get('/:id', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (admin only)
router.patch('/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['visitor', 'operator', 'supervisor', 'manager', 'administrator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Prevent user from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password').populate('assignedSites', 'name code');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user assigned sites (admin only)
router.patch('/:id/sites', auth, isAdmin, async (req, res) => {
  try {
    const { assignedSites } = req.body;
    
    if (!Array.isArray(assignedSites)) {
      return res.status(400).json({ message: 'assignedSites must be an array' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedSites },
      { new: true, runValidators: true }
    ).select('-password').populate('assignedSites', 'name code type');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User sites updated successfully', user });
  } catch (error) {
    console.error('Error updating user sites:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Prevent user from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot deactivate your own account' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, 
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user details (admin only)
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, department, phone } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (department) updates.department = department;
    if (phone !== undefined) updates.phone = phone;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    // Prevent user from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
