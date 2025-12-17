const express = require('express');
const router = express.Router();
const Maintenance = require('../models/maintenance');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');

// When maintenance is done, we need to deduct the materials used from inventory
// This helper function handles that logic
const deductInventory = async (materialsUsed) => {
  const deductionResults = [];
  const errors = [];
  
  for (const material of materialsUsed) {
    try {
      const inventoryItem = await Inventory.findById(material.inventoryItem);
      
      if (!inventoryItem) {
        errors.push(`Can't find inventory item ${material.inventoryItem}`);
        continue;
      }
      
      // Make sure we have enough stock
      if (inventoryItem.currentStock < material.quantityUsed) {
        errors.push(`Not enough ${inventoryItem.name} in stock. Available: ${inventoryItem.currentStock}, Need: ${material.quantityUsed}`);
        continue;
      }
      
      // All good - deduct the used quantity
      inventoryItem.currentStock -= material.quantityUsed;
      await inventoryItem.save();
      
      deductionResults.push({
        itemId: inventoryItem._id,
        itemName: inventoryItem.name,
        quantityDeducted: material.quantityUsed,
        remainingStock: inventoryItem.currentStock
      });
    } catch (error) {
      errors.push(`Problem with ${material.inventoryItem}: ${error.message}`);
    }
  }
  
  return { deductionResults, errors };
};

// Helper function to figure out when the next maintenance should happen
const calculateNextMaintenanceDate = (currentDate, pattern) => {
  const date = new Date(currentDate);
  
  // Add the right amount of time based on the pattern
  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'fortnight':
      date.setDate(date.getDate() + 14); // Every 2 weeks
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3); // Every 3 months
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null; // Unknown pattern
  }
  
  return date;
};

// Helper function to create the next recurring maintenance activity
const createNextMaintenance = async (completedMaintenance) => {
  // Skip if this isn't a recurring maintenance task
  if (!completedMaintenance.isRecurring || !completedMaintenance.recurrencePattern) {
    return null;
  }
  
  const nextDate = calculateNextMaintenanceDate(
    completedMaintenance.completedDate || new Date(),
    completedMaintenance.recurrencePattern
  );
  
  if (!nextDate) return null;
  
  // Check if we've reached the end of the recurrence period
  if (completedMaintenance.recurrenceEndDate && nextDate > new Date(completedMaintenance.recurrenceEndDate)) {
    console.log('✅ Recurrence ended for maintenance:', completedMaintenance.title);
    return null;
  }
  
  // Create a new maintenance activity for the next scheduled date
  const nextMaintenance = new Maintenance({
    title: completedMaintenance.title,
    description: completedMaintenance.description,
    machineId: completedMaintenance.machineId,
    site: completedMaintenance.site,
    status: 'pending',
    priority: completedMaintenance.priority,
    scheduledDate: nextDate,
    dueDate: nextDate,
    assignedTo: completedMaintenance.assignedTo,
    isRecurring: true,
    recurrencePattern: completedMaintenance.recurrencePattern,
    recurrenceInterval: completedMaintenance.recurrenceInterval,
    recurrenceEndDate: completedMaintenance.recurrenceEndDate,
    parentMaintenanceId: completedMaintenance.parentMaintenanceId || completedMaintenance._id,
  });
  
  await nextMaintenance.save();
  console.log('🔁 Created next maintenance:', nextMaintenance.title, 'for', nextDate.toLocaleDateString());
  return nextMaintenance;
};

// Get all maintenance records (sorted newest first, filtered by role)
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
    // Managers and administrators see all maintenance
    
    const records = await Maintenance.find(query)
      .populate({
        path: 'machineId',
        select: 'name model serialNumber',
        strictPopulate: false
      })
      .populate({
        path: 'site',
        select: 'name code location',
        strictPopulate: false
      })
      .populate({
        path: 'materialsUsed.inventoryItem',
        select: 'name category currentStock',
        strictPopulate: false
      })
      .sort({ createdAt: -1 })
      .lean();
    
    // Clean up records to handle null references
    const cleanRecords = records.map(record => ({
      ...record,
      machineId: record.machineId || null,
      site: record.site || null,
      materialsUsed: (record.materialsUsed || []).map(material => ({
        ...material,
        inventoryItem: material.inventoryItem || null
      }))
    }));
    
    res.json(cleanRecords);
  } catch (error) {
    console.error('❌ Failed to fetch maintenance records:', error);
    res.status(500).json({ message: 'Could not load maintenance records. Please try again.' });
  }
});

// Create a new maintenance record
router.post('/', auth, async (req, res) => {
  const maintenance = new Maintenance({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate
  });

  try {
    const newRecord = await maintenance.save();
    console.log('✅ New maintenance record created:', newRecord.title);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('❌ Failed to create maintenance record:', error);
    res.status(400).json({ message: error.message || 'Could not create maintenance record. Please check your inputs.' });
  }
});

// Get a specific maintenance record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('machineId', 'name model serialNumber')
      .populate('site', 'name code location');
    
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found.' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('❌ Error fetching maintenance record:', error);
    res.status(500).json({ message: 'Could not load maintenance details. Please try again.' });
  }
});

// Update a maintenance record
router.put('/:id', auth, async (req, res) => {
  try {
    const oldRecord = await Maintenance.findById(req.params.id);
    
    let inventoryDeductionResults = null;
    let inventoryErrors = [];
    
    // If they're marking this as completed, handle completion logic
    if (req.body.status === 'completed' && oldRecord.status !== 'completed') {
      req.body.completedDate = new Date();
      
      // Deduct materials used from inventory
      if (req.body.materialsUsed && req.body.materialsUsed.length > 0) {
        const { deductionResults, errors } = await deductInventory(req.body.materialsUsed);
        inventoryDeductionResults = deductionResults;
        inventoryErrors = errors;
        
        // Update materials to mark whether they were successfully deducted
        req.body.materialsUsed = req.body.materialsUsed.map(material => ({
          ...material,
          deductedFromInventory: errors.length === 0
        }));
      }
    }
    
    const updatedRecord = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('machineId', 'name model serialNumber')
      .populate('site', 'name code location.city')
      .populate('materialsUsed.inventoryItem', 'name category currentStock');
    
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Maintenance record not found.' });
    }
    
    const response = { ...updatedRecord.toObject() };
    
    // Let them know what happened with inventory
    if (inventoryDeductionResults) {
      response.inventoryDeducted = inventoryDeductionResults;
    }
    if (inventoryErrors.length > 0) {
      response.inventoryErrors = inventoryErrors;
      console.log('⚠️ Inventory issues:', inventoryErrors);
    }
    
    // Auto-schedule the next occurrence if this is a recurring task
    if (updatedRecord.status === 'completed' && 
        oldRecord.status !== 'completed' && 
        updatedRecord.isRecurring) {
      const nextMaintenance = await createNextMaintenance(updatedRecord);
      if (nextMaintenance) {
        response.nextMaintenanceScheduled = true;
        response.nextMaintenanceId = nextMaintenance._id;
        response.nextMaintenanceDate = nextMaintenance.scheduledDate;
        console.log('🔁 Scheduled next maintenance for:', nextMaintenance.scheduledDate.toLocaleDateString());
      }
    }
    
    console.log('✅ Maintenance updated:', updatedRecord.title);
    res.json(response);
  } catch (error) {
    console.error('❌ Failed to update maintenance:', error);
    res.status(400).json({ message: error.message || 'Could not update maintenance record.' });
  }
});

// Update maintenance record (PATCH - for smaller updates)
router.patch('/:id', auth, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found.' });
    }

    const wasCompleted = record.status === 'completed';
    
    let inventoryDeductionResults = null;
    let inventoryErrors = [];
    
    // Handle completion logic if status is changing to completed
    if (req.body.status === 'completed' && record.status !== 'completed') {
      req.body.completedDate = new Date();
      
      // Deduct inventory items if materials were used
      if (req.body.materialsUsed && req.body.materialsUsed.length > 0) {
        const { deductionResults, errors } = await deductInventory(req.body.materialsUsed);
        inventoryDeductionResults = deductionResults;
        inventoryErrors = errors;
        
        // Mark materials as deducted
        req.body.materialsUsed = req.body.materialsUsed.map(material => ({
          ...material,
          deductedFromInventory: errors.length === 0
        }));
      }
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] != null) {
        record[key] = req.body[key];
      }
    });

    const updatedRecord = await record.save();
    await updatedRecord.populate('machineId', 'name model serialNumber');
    await updatedRecord.populate('site', 'name code location.city');
    await updatedRecord.populate('materialsUsed.inventoryItem', 'name category currentStock');
    
    const response = { ...updatedRecord.toObject() };
    
    // Add inventory deduction info to response
    if (inventoryDeductionResults) {
      response.inventoryDeducted = inventoryDeductionResults;
    }
    if (inventoryErrors.length > 0) {
      response.inventoryErrors = inventoryErrors;
    }
    
    // Auto-schedule next maintenance if this is a recurring task that was just completed
    if (updatedRecord.status === 'completed' && 
        !wasCompleted && 
        updatedRecord.isRecurring) {
      const nextMaintenance = await createNextMaintenance(updatedRecord);
      if (nextMaintenance) {
        response.nextMaintenanceScheduled = true;
        response.nextMaintenanceId = nextMaintenance._id;
        response.nextMaintenanceDate = nextMaintenance.scheduledDate;
      }
    }
    
    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a maintenance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    await record.deleteOne();
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;