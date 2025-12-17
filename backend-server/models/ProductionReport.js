const mongoose = require('mongoose');

const dailyProductionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: false  // Allow empty daily production entries
  },
  plannedTime: {
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  },
  startTime: {
    hours: { type: Number },
    minutes: { type: Number }
  },
  input: {
    type: Number, // in Kg
    default: 0
  },
  stopTime: {
    hours: { type: Number },
    minutes: { type: Number }
  },
  output: {
    type: Number, // in Kg
    default: 0
  },
  downtime: {
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  },
  usedTime: {
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  },
  reason: {
    type: String,
    default: ''
  },
  actionTaken: {
    type: String,
    default: ''
  }
});

const machineInspectionSchema = new mongoose.Schema({
  dateOfInspection: {
    type: Date,
    required: false  // Allow empty inspections
  },
  observationMade: {
    type: String,
    required: false  // Allow empty observations
  },
  supportRequired: {
    type: String,
    default: ''
  },
  reportedToWho: {
    type: String,
    default: ''
  },
  dateOfReporting: {
    type: Date
  },
  supportGiven: {
    type: String,
    default: ''
  }
});

const productionReportSchema = new mongoose.Schema({
  // Document Control
  imsId: {
    type: String,
    default: 'AWM-MTN-RP092',
    required: true
  },
  version: {
    type: String,
    default: 'V1.0'
  },
  documentTitle: {
    type: String,
    default: 'WEEKLY PRODUCTION REPORT'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  nextReview: {
    type: Date
  },
  
  // Report Information
  reportingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Personnel
  operators: [{
    type: String
  }],
  opsManager: {
    type: String
  },
  supervisor: {
    type: String
  },
  
  // Machine & Site
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  
  // Daily Production Data (7 days)
  dailyProduction: [dailyProductionSchema],
  
  // Daily Machine Inspections
  machineInspections: [machineInspectionSchema],
  
  // Signatures
  signatures: {
    operator: {
      name: { type: String },
      position: { type: String },
      date: { type: Date },
      signature: { type: String } // Can store signature image URL or text
    },
    supervisor: {
      name: { type: String },
      position: { type: String },
      date: { type: Date },
      signature: { type: String }
    },
    manager: {
      name: { type: String },
      position: { type: String },
      date: { type: Date },
      signature: { type: String }
    }
  },
  
  // Summary Calculations
  summary: {
    totalInput: { type: Number, default: 0 },
    totalOutput: { type: Number, default: 0 },
    totalDowntime: { type: Number, default: 0 }, // in minutes
    totalUsedTime: { type: Number, default: 0 }, // in minutes
    efficiency: { type: Number, default: 0 }, // percentage
    averageOutputPerDay: { type: Number, default: 0 }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved'],
    default: 'draft'
  },
  
  // Additional Notes
  notes: {
    type: String
  },
  
  // Created/Updated By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate summary before saving
productionReportSchema.pre('save', function(next) {
  if (this.dailyProduction && this.dailyProduction.length > 0) {
    let totalInput = 0;
    let totalOutput = 0;
    let totalDowntimeMinutes = 0;
    let totalUsedTimeMinutes = 0;
    
    this.dailyProduction.forEach(day => {
      totalInput += day.input || 0;
      totalOutput += day.output || 0;
      totalDowntimeMinutes += (day.downtime.hours * 60) + day.downtime.minutes;
      totalUsedTimeMinutes += (day.usedTime.hours * 60) + day.usedTime.minutes;
    });
    
    this.summary.totalInput = totalInput;
    this.summary.totalOutput = totalOutput;
    this.summary.totalDowntime = totalDowntimeMinutes;
    this.summary.totalUsedTime = totalUsedTimeMinutes;
    this.summary.averageOutputPerDay = totalOutput / this.dailyProduction.length;
    
    // Calculate efficiency (output/input * 100)
    if (totalInput > 0) {
      this.summary.efficiency = ((totalOutput / totalInput) * 100).toFixed(2);
    }
  }
  
  next();
});

// Index for faster queries
productionReportSchema.index({ machine: 1, 'reportingPeriod.startDate': -1 });
productionReportSchema.index({ site: 1, status: 1 });
productionReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ProductionReport', productionReportSchema);
