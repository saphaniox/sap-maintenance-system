const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    enum: ['electrical', 'mechanical', 'hydraulic', 'pneumatic', 'electronics', 'safety', 'general', 'other'],
    default: 'general',
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  currentStock: {
    type: Number,
    default: 0,
  },
  minStock: {
    type: Number,
    default: 0,
  },
  maxStock: Number,
  unit: {
    type: String,
    default: 'pcs',
  },
  cost: Number,
  supplier: {
    name: String,
    contact: String,
    phone: String,
    email: String,
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
  },
  location: String,
  reorderPoint: {
    type: Number,
    default: 0,
  },
  lastRestocked: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
