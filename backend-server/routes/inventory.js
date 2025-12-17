const express = require('express');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all inventory items (only active ones, filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: true };
    
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
    // Managers and administrators see all inventory
    
    const items = await Inventory.find(query)
      .populate('site', 'name code type location.city')
      .sort({ createdAt: -1 }); // Newest first
    res.json(items);
  } catch (error) {
    console.error('❌ Failed to fetch inventory:', error);
    res.status(500).json({ message: 'Could not load inventory. Please try again.' });
  }
});

// Create a new inventory item
router.post('/', auth, async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    await item.populate('site', 'name code type location.city');
    console.log('✅ Inventory item created:', item.name);
    res.status(201).json(item);
  } catch (error) {
    console.error('❌ Failed to create inventory item:', error);
    res.status(500).json({ message: 'Could not create inventory item. Please check your inputs.' });
  }
});

// Update an inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('site', 'name code type location.city');
    if (!item) return res.status(404).json({ message: 'Inventory item not found.' });
    console.log('✅ Inventory updated:', item.name);
    res.json(item);
  } catch (error) {
    console.error('❌ Failed to update inventory:', error);
    res.status(500).json({ message: 'Could not update inventory item. Please try again.' });
  }
});

// Delete inventory item (soft delete - just marks as inactive)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
    console.log('🗑️ Inventory item deactivated');
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete inventory:', error);
    res.status(500).json({ message: 'Could not delete item. Please try again.' });
  }
});

module.exports = router;
