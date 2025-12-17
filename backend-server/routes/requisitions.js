const express = require('express');
const Requisition = require('../models/Requisition');
const auth = require('../middleware/auth');
const { checkPermission, isManagerOrAdmin } = require('../middleware/permissions');
const router = express.Router();

// Get all requisitions (newest first, filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'operator' || req.user.role === 'supervisor') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user.assignedSites && user.assignedSites.length > 0) {
        query.site = { $in: user.assignedSites };
      } else {
        return res.json([]); // No sites assigned, return empty
      }
    }
    // Managers and administrators see all requisitions
    
    const reqs = await Requisition.find(query).sort({ createdAt: -1 }).populate('requestedBy approvedBy items.inventoryItem');
    res.json(reqs);
  } catch (error) {
    console.error('❌ Failed to fetch requisitions:', error);
    res.status(500).json({ message: 'Could not load requisitions. Please try again.' });
  }
});

// Create a new requisition
router.post('/', auth, async (req, res) => {
  try {
    const data = req.body;
    data.requestedBy = req.user._id; // Track who requested this
    const requisition = new Requisition(data);
    await requisition.save();
    console.log('✅ Requisition created by:', req.user.name);
    res.status(201).json(requisition);
  } catch (error) {
    console.error('❌ Failed to create requisition:', error);
    res.status(500).json({ message: 'Could not create requisition. Please try again.' });
  }
});

// Update a requisition
router.put('/:id', auth, async (req, res) => {
  try {
    const update = req.body;
    // If they're approving it, track who and when
    if (update.status === 'approved') {
      update.approvedBy = req.user._id;
      update.approvedDate = new Date();
    }
    const updated = await Requisition.findByIdAndUpdate(req.params.id, update, { new: true });
    console.log('✅ Requisition updated');
    res.json(updated);
  } catch (error) {
    console.error('❌ Failed to update requisition:', error);
    res.status(500).json({ message: 'Could not update requisition. Please try again.' });
  }
});

// Delete a requisition
router.delete('/:id', auth, async (req, res) => {
  try {
    const requisition = await Requisition.findByIdAndDelete(req.params.id);
    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found.' });
    }
    console.log('🗑️ Requisition deleted');
    res.json({ message: 'Requisition deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete requisition:', error);
    res.status(500).json({ message: 'Could not delete requisition. Please try again.' });
  }
});

// Approve a requisition (managers/admins only)
router.post('/:id/approve', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const updated = await Requisition.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedBy: req.user._id,
        approvedDate: new Date()
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Requisition not found.' });
    }
    
    console.log('✅ Requisition approved by:', req.user.name);
    res.json(updated);
  } catch (error) {
    console.error('❌ Failed to approve requisition:', error);
    res.status(500).json({ message: 'Could not approve requisition. Please try again.' });
  }
});

// Reject a requisition (managers/admins only)
router.post('/:id/reject', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const updated = await Requisition.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectedBy: req.user._id,
        rejectedDate: new Date(),
        rejectionReason: req.body.reason || 'No reason provided'
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Requisition not found.' });
    }
    
    console.log('❌ Requisition rejected by:', req.user.name);
    res.json(updated);
  } catch (error) {
    console.error('❌ Failed to reject requisition:', error);
    res.status(500).json({ message: 'Could not reject requisition. Please try again.' });
  }
});

module.exports = router;
