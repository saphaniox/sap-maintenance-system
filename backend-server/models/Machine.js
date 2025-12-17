const mongoose = require('mongoose');

// Machine model - stores info about all our equipment
const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [ // predefined machine types we work with
      'composter_5_tonne',
      'composter_3_tonne', 
      'composter_1_tonne',
      'shredder',
      'baler',
      'scissor_lift',
      'weighing_scale',
      'trolley',
      'pallet_jack',
      'other'
    ],
    default: 'other'
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Every machine must belong to a site']
  },
  model: String,
  serialNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  location: String, // Where at the site (e.g., "Building A, Floor 2")
  department: String,
  status: {
    type: String,
    enum: ['operational', 'under_maintenance', 'out_of_service', 'running'],
    default: 'operational',
  },
  lastMaintenance: Date, // When was it last serviced
  nextMaintenance: Date, // When is the next service due
  maintenanceInterval: {
    type: Number,
    default: 30, // Days between maintenance (default monthly)
  },
  specifications: {
    type: Map,
    of: String, // Flexible key-value pairs for machine specs
  },
  notes: String, // Any additional info
  installedDate: Date,
  manufacturer: String,
  isActive: {
    type: Boolean,
    default: true, // Soft delete - machines aren't actually deleted
  },
}, {
  timestamps: true, // Track when machines are added/updated
});

module.exports = mongoose.model('Machine', machineSchema);
