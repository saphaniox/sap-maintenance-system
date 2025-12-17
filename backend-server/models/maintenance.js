const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: false
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  assignedTo: {
    type: String
  },
  cost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  // Materials/spares used
  materialsUsed: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantityUsed: {
      type: Number,
      required: true,
      min: 0
    },
    deductedFromInventory: {
      type: Boolean,
      default: false
    }
  }],
  // Recurring maintenance fields
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'fortnight', 'monthly', 'quarterly', 'yearly', null],
    default: null
  },
  recurrenceInterval: {
    type: Number, // e.g., every 2 weeks
    default: 1
  },
  recurrenceEndDate: {
    type: Date
  },
  parentMaintenanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance', // Reference to the original recurring task
    default: null
  },
  isTemplate: {
    type: Boolean,
    default: false // True if this is the master recurring template
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);