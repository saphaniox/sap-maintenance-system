const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');
const { checkPermission, isManagerOrAdmin } = require('../middleware/permissions');

// Get all sites (with optional filters, filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    
    // Filter based on user role
    if (req.user.role === 'operator' || req.user.role === 'supervisor') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user.assignedSites && user.assignedSites.length > 0) {
        query._id = { $in: user.assignedSites };
      } else {
        return res.json([]); // No sites assigned, return empty
      }
    }
    // Managers and administrators see all sites
    
    // Apply additional filters if provided
    if (status) query.status = status;
    if (type) query.type = type;

    const sites = await Site.find(query)
      .populate('manager', 'name email role')
      .sort({ name: 1 }); // Alphabetical order

    // Add machine counts for each site (helps with dashboard stats)
    const sitesWithCounts = await Promise.all(
      sites.map(async (site) => {
        const siteObj = site.toObject();
        const totalMachines = await Machine.countDocuments({ site: site._id });
        const activeMachines = await Machine.countDocuments({ 
          site: site._id, 
          status: { $in: ['operational', 'running'] }
        });
        
        return {
          ...siteObj,
          totalMachines,
          activeMachines
        };
      })
    );

    res.json(sitesWithCounts);
  } catch (error) {
    console.error('❌ Failed to fetch sites:', error);
    res.status(500).json({ message: 'Could not load sites. Please try again.' });
  }
});

// Get machines at a specific site (MUST come before /:id route)
router.get('/:id/machines', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = { site: req.params.id };
    
    if (status) query.status = status;
    if (type) query.type = type;

    const machines = await Machine.find(query)
      .sort({ name: 1 });

    res.json(machines);
  } catch (error) {
    console.error('Error fetching site machines:', error);
    res.status(500).json({ 
      message: 'Failed to fetch machines', 
      error: error.message 
    });
  }
});

// Get site statistics (MUST come before /:id route)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const machines = await Machine.find({ site: site._id });
    
    // Count by status
    const statusCounts = machines.reduce((acc, machine) => {
      acc[machine.status] = (acc[machine.status] || 0) + 1;
      return acc;
    }, {});

    // Count by type
    const typeCounts = machines.reduce((acc, machine) => {
      acc[machine.type] = (acc[machine.type] || 0) + 1;
      return acc;
    }, {});

    // Upcoming maintenance
    const upcomingMaintenance = await Machine.find({
      site: site._id,
      nextMaintenance: { 
        $gte: new Date(), 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      }
    }).select('name nextMaintenance').sort({ nextMaintenance: 1 });

    res.json({
      siteName: site.name,
      siteCode: site.code,
      totalMachines: machines.length,
      statusCounts,
      typeCounts,
      upcomingMaintenance: upcomingMaintenance.length,
      upcomingMaintenanceDetails: upcomingMaintenance
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
});

// Get single site
router.get('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('manager', 'name email role phone');

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Get machines at this site
    const machines = await Machine.find({ site: site._id })
      .select('name type status serialNumber model')
      .sort({ name: 1 });

    const siteObj = site.toObject();
    siteObj.machines = machines;
    siteObj.totalMachines = machines.length;
    siteObj.activeMachines = machines.filter(m => 
      m.status === 'operational' || m.status === 'running'
    ).length;

    res.json(siteObj);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ message: 'Failed to fetch site', error: error.message });
  }
});

// Create a new site
router.post('/', auth, async (req, res) => {
  try {
    const site = new Site(req.body);
    await site.save();
    console.log('✅ New site created:', site.name);
    res.status(201).json(site);
  } catch (error) {
    console.error('❌ Failed to create site:', error);
    
    // Duplicate site code
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'This site code is already in use. Please choose a different one.' 
      });
    }
    
    res.status(400).json({ 
      message: 'Could not create site. Please check your inputs and try again.' 
    });
  }
});

// Update a site
router.put('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'name email role');

    if (!site) {
      return res.status(404).json({ message: 'Site not found.' });
    }

    console.log('✅ Site updated:', site.name);
    res.json(site);
  } catch (error) {
    console.error('❌ Failed to update site:', error);
    res.status(400).json({ 
      message: 'Could not update site. Please try again.' 
    });
  }
});

// Delete a site
router.delete('/:id', auth, async (req, res) => {
  try {
    // Make sure the site doesn't have any machines first
    const machineCount = await Machine.countDocuments({ site: req.params.id });
    
    if (machineCount > 0) {
      return res.status(400).json({ 
        message: `Can't delete this site - it has ${machineCount} machine(s). Please move or delete the machines first.` 
      });
    }

    const site = await Site.findByIdAndDelete(req.params.id);

    if (!site) {
      return res.status(404).json({ message: 'Site not found.' });
    }

    console.log('🗑️ Site deleted:', site.name);
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete site:', error);
    res.status(500).json({ 
      message: 'Could not delete site. Please try again.' 
    });
  }
});

module.exports = router;
