const express = require('express');
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const router = express.Router();

// Fetch all machines - but only show active ones and filter by what the user is allowed to see
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Operators and supervisors can only see machines from their assigned sites
    if (req.user.role === 'operator' || req.user.role === 'supervisor') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user.assignedSites && user.assignedSites.length > 0) {
        query.site = { $in: user.assignedSites };
      } else {
        return res.json([]); // No sites assigned, return empty
      }
    }
    // Managers and administrators see all machines
    
    const machines = await Machine.find(query)
      .populate('site', 'name code type status location.city')
      .sort({ createdAt: -1 }); // Newest first
    res.json(machines);
  } catch (error) {
    console.error('❌ Failed to fetch machines:', error);
    res.status(500).json({ message: 'Could not load machines. Please try again.' });
  }
});

// Get a single machine by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('site', 'name code type status location');
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found. It may have been deleted.' });
    }
    
    res.json(machine);
  } catch (error) {
    console.error('❌ Error fetching machine:', error);
    res.status(500).json({ message: 'Could not load machine details. Please try again.' });
  }
});

// Create a new machine
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating new machine:', req.body.name || req.body.model);
    
    const machine = new Machine(req.body);
    await machine.save();
    await machine.populate('site', 'name code type status location.city');
    
    console.log('✅ Machine created successfully:', machine.name || machine.model);
    res.status(201).json(machine);
  } catch (error) {
    console.error('❌ Failed to create machine:', error);
    res.status(500).json({ message: error.message || 'Could not create machine. Please check your inputs and try again.' });
  }
});

// Update an existing machine
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('🔧 Updating machine:', req.params.id);
    
    const machine = await Machine.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } // Return updated doc and validate
    ).populate('site', 'name code type status location.city');
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found. It may have been deleted.' });
    }
    
    console.log('✅ Machine updated:', machine.name || machine.model);
    res.json(machine);
  } catch (error) {
    console.error('❌ Failed to update machine:', error);
    res.status(500).json({ message: error.message || 'Could not update machine. Please try again.' });
  }
});

// Delete machine (soft delete - just marks as inactive)
router.delete('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found.' });
    }
    
    console.log('🗑️ Machine deactivated:', machine.name || machine.model);
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting machine:', error);
    res.status(500).json({ message: 'Could not delete machine. Please try again.' });
  }
});

module.exports = router;
