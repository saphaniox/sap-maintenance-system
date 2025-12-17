const mongoose = require('mongoose');

const requisitionSchema = new mongoose.Schema({
  requisitionNumber: {
    type: String,
    unique: true,
    required: true,
  },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
    },
    quantity: Number,
    purpose: String,
  }],
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'partially_fulfilled', 'fulfilled'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  neededBy: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedDate: Date,
  rejectionReason: String,
  notes: String,
}, {
  timestamps: true,
});

requisitionSchema.pre('save', async function(next) {
  if (!this.requisitionNumber) {
    const count = await mongoose.model('Requisition').countDocuments();
    this.requisitionNumber = `REQ-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Requisition', requisitionSchema);
