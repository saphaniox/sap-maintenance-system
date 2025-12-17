const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Site code is required'],
    unique: true, // unique creates index automatically, no need for separate index
    trim: true,
    uppercase: true
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    region: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Uganda',
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  type: {
    type: String,
    enum: ['water_treatment', 'waste_management', 'industrial', 'warehouse', 'office', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'closed'],
    default: 'active'
  },
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  operatingHours: {
    start: {
      type: String,
      default: '08:00'
    },
    end: {
      type: String,
      default: '17:00'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  capacity: {
    type: String,
    trim: true
  },
  establishedDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Statistics (computed from machines)
  totalMachines: {
    type: Number,
    default: 0
  },
  activeMachines: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
siteSchema.index({ name: 1 });
// Code index already created by unique: true in schema
siteSchema.index({ status: 1 });
siteSchema.index({ type: 1 });

// Virtual for full location
siteSchema.virtual('fullLocation').get(function() {
  const parts = [
    this.location.address,
    this.location.city,
    this.location.region,
    this.location.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Method to update machine count
siteSchema.methods.updateMachineCount = async function() {
  const Machine = mongoose.model('Machine');
  const totalMachines = await Machine.countDocuments({ site: this._id });
  const activeMachines = await Machine.countDocuments({ 
    site: this._id, 
    status: { $in: ['operational', 'running'] }
  });
  
  this.totalMachines = totalMachines;
  this.activeMachines = activeMachines;
  await this.save();
};

// Static method to get site with machine count
siteSchema.statics.findWithMachineCount = async function(query = {}) {
  const Machine = mongoose.model('Machine');
  
  const sites = await this.find(query)
    .populate('manager', 'name email')
    .sort({ name: 1 });
  
  // Add machine counts
  for (let site of sites) {
    const totalMachines = await Machine.countDocuments({ site: site._id });
    const activeMachines = await Machine.countDocuments({ 
      site: site._id, 
      status: { $in: ['operational', 'running'] }
    });
    site.totalMachines = totalMachines;
    site.activeMachines = activeMachines;
  }
  
  return sites;
};

module.exports = mongoose.model('Site', siteSchema);
