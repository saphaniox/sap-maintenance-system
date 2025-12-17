const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Machine = require('../models/Machine');
const Inventory = require('../models/Inventory');
const Maintenance = require('../models/Maintenance');
const Site = require('../models/Site');
const Requisition = require('../models/Requisition');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maintenance-tracker';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear collections
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Machine.deleteMany({});
    await Inventory.deleteMany({});
    await Maintenance.deleteMany({});
    await Site.deleteMany({});
    await Requisition.deleteMany({});

    // ========== USERS ==========
    console.log('👥 Creating users...');
    const admin = await User.create({
      name: 'John Administrator',
      email: 'admin@sap-tech.com',
      password: 'admin123',
      role: 'administrator',
    });

    const manager = await User.create({
      name: 'Sarah Manager',
      email: 'manager@sap-tech.com',
      password: 'manager123',
      role: 'manager',
    });

    const supervisor = await User.create({
      name: 'Mike Supervisor',
      email: 'supervisor@sap-tech.com',
      password: 'supervisor123',
      role: 'supervisor',
    });

    const operator = await User.create({
      name: 'David Operator',
      email: 'operator@sap-tech.com',
      password: 'operator123',
      role: 'operator',
    });

    console.log(`   ✓ Created ${4} users`);

    // ========== SITES ==========
    console.log('🏭 Creating sites...');
    const sites = await Site.create([
      {
        name: 'TWSA Tangi',
        code: 'TWSA-TNG',
        location: {
          address: 'Tangi Industrial Area',
          city: 'Tangi',
          region: 'Western Region',
          country: 'Uganda'
        },
        type: 'waste_management',
        status: 'active',
        contactPerson: {
          name: 'Robert Mukasa',
          phone: '+256-777-123456',
          email: 'tangi@twsa.ug'
        },
        operatingHours: {
          start: '08:00',
          end: '17:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        description: 'Main waste management facility - Tangi',
        capacity: 'Medium scale waste processing - 50 tonnes/day'
      },
      {
        name: 'TWSA Buliisa',
        code: 'TWSA-BLS',
        location: {
          address: 'Buliisa District',
          city: 'Buliisa',
          region: 'Western Region',
          country: 'Uganda'
        },
        type: 'waste_management',
        status: 'active',
        contactPerson: {
          name: 'Grace Nabirye',
          phone: '+256-777-234567',
          email: 'buliisa@twsa.ug'
        },
        operatingHours: {
          start: '08:00',
          end: '17:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        description: 'Large scale waste processing facility',
        capacity: 'Large scale - 100 tonnes/day'
      },
      {
        name: 'TWSA DSB Kampala',
        code: 'TWSA-DSB',
        location: {
          address: 'Directorate of Sanitation, Plot 10 Kampala Rd',
          city: 'Kampala',
          region: 'Central Region',
          country: 'Uganda'
        },
        type: 'waste_management',
        status: 'active',
        contactPerson: {
          name: 'James Opio',
          phone: '+256-777-345678',
          email: 'dsb@twsa.ug'
        },
        operatingHours: {
          start: '06:00',
          end: '18:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        description: 'High capacity central waste management hub',
        capacity: 'High capacity - 200 tonnes/day'
      }
    ]);

    console.log(`   ✓ Created ${sites.length} sites`);

    // ========== MACHINES ==========
    console.log('⚙️  Creating machines...');
    const machines = await Machine.create([
      // Tangi Machines
      {
        name: '5 Tonne Composter Unit-A',
        type: 'composter_5_tonne',
        model: 'COMP-5T-PRO',
        serialNumber: 'TNG-COMP5T-001',
        manufacturer: 'Waste Solutions Ltd',
        location: 'Tangi - Composting Zone A',
        status: 'operational',
        site: sites[0]._id,
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2025-01-15'),
        specifications: { capacity: '5 tonnes', power: '15 kW', voltage: '380V' },
        notes: 'Primary composting unit for organic waste processing'
      },
      {
        name: 'Shredder Machine-1',
        type: 'shredder',
        model: 'SHR-500-HD',
        serialNumber: 'TNG-SHR-002',
        manufacturer: 'Industrial Shredders Inc',
        location: 'Tangi - Pre-processing Area',
        status: 'operational',
        site: sites[0]._id,
        purchaseDate: new Date('2023-03-20'),
        warrantyExpiry: new Date('2025-03-20'),
        specifications: { capacity: '500 kg/hr', power: '25 kW', bladeType: 'Heavy Duty' },
        notes: 'Waste shredder for size reduction'
      },
      // Buliisa Machines
      {
        name: '10 Tonne Composter Unit-B',
        type: 'composter_5_tonne',
        model: 'COMP-10T-PRO',
        serialNumber: 'BLS-COMP10T-001',
        manufacturer: 'Waste Solutions Ltd',
        location: 'Buliisa - Main Composting Hall',
        status: 'operational',
        site: sites[1]._id,
        purchaseDate: new Date('2022-11-10'),
        warrantyExpiry: new Date('2024-11-10'),
        specifications: { capacity: '10 tonnes', power: '30 kW', voltage: '380V' },
        notes: 'High capacity composting system'
      },
      {
        name: 'Conveyor Belt System-A',
        type: 'other',
        model: 'CBT-2000',
        serialNumber: 'BLS-CONV-002',
        manufacturer: 'Transport Systems Co',
        location: 'Buliisa - Material Handling',
        status: 'under_maintenance',
        site: sites[1]._id,
        purchaseDate: new Date('2023-05-15'),
        warrantyExpiry: new Date('2025-05-15'),
        specifications: { length: '20 meters', speed: '2 m/s', capacity: '1000 kg/hr' },
        notes: 'Main conveyor for waste transport - requires belt replacement'
      },
      // DSB Machines
      {
        name: 'Industrial Compactor-1',
        type: 'baler',
        model: 'CMPT-3000',
        serialNumber: 'DSB-CMPT-001',
        manufacturer: 'Heavy Duty Equipment Ltd',
        location: 'DSB - Compaction Zone',
        status: 'operational',
        site: sites[2]._id,
        purchaseDate: new Date('2023-02-20'),
        warrantyExpiry: new Date('2025-02-20'),
        specifications: { force: '300 tonnes', power: '50 kW', cycleTime: '45 seconds' },
        notes: 'High pressure waste compactor'
      },
      {
        name: 'Sorting Conveyor System',
        type: 'other',
        model: 'SORT-500',
        serialNumber: 'DSB-SORT-002',
        manufacturer: 'AutoSort Technologies',
        location: 'DSB - Sorting Facility',
        status: 'operational',
        site: sites[2]._id,
        purchaseDate: new Date('2023-06-10'),
        warrantyExpiry: new Date('2025-06-10'),
        specifications: { lanes: '3', speed: '1.5 m/s', sensors: 'Optical + Metal' },
        notes: 'Automated waste sorting system'
      },
      {
        name: 'Backup Generator',
        type: 'other',
        model: 'GEN-250KVA',
        serialNumber: 'DSB-GEN-003',
        manufacturer: 'PowerMax Generators',
        location: 'DSB - Power House',
        status: 'out_of_service',
        site: sites[2]._id,
        purchaseDate: new Date('2022-08-15'),
        warrantyExpiry: new Date('2024-08-15'),
        specifications: { capacity: '250 KVA', fuelType: 'Diesel', runtime: '12 hours' },
        notes: 'Emergency power backup - needs engine overhaul'
      }
    ]);

    console.log(`   ✓ Created ${machines.length} machines`);

    // ========== INVENTORY ==========
    console.log('📦 Creating inventory items...');
    const inventoryItems = await Inventory.create([
      {
        name: 'Air Filter (Heavy Duty)',
        itemCode: 'FILTER-HD-001',
        category: 'Spare Parts',
        description: 'High efficiency air filter for composter units',
        currentStock: 15,
        minStock: 5,
        maxStock: 30,
        unitPrice: 45000,
        supplier: 'Filter Solutions Uganda',
        location: 'Warehouse A - Shelf 12'
      },
      {
        name: 'Conveyor Belt (20m)',
        itemCode: 'BELT-20M-001',
        category: 'Spare Parts',
        description: 'Heavy duty conveyor belt - 20 meter length',
        currentStock: 2,
        minStock: 2,
        maxStock: 5,
        unitPrice: 850000,
        supplier: 'Industrial Supplies Ltd',
        location: 'Warehouse B - Section 3'
      },
      {
        name: 'Hydraulic Oil (20L)',
        itemCode: 'OIL-HYD-20L',
        category: 'Consumables',
        description: 'ISO 68 Hydraulic oil for compactors',
        currentStock: 8,
        minStock: 10,
        maxStock: 25,
        unitPrice: 120000,
        supplier: 'Shell Uganda',
        location: 'Chemical Store - Tank 5'
      },
      {
        name: 'Shredder Blades (Set of 4)',
        itemCode: 'BLADE-SHR-SET4',
        category: 'Spare Parts',
        description: 'Hardened steel blades for shredder machines',
        currentStock: 12,
        minStock: 6,
        maxStock: 20,
        unitPrice: 350000,
        supplier: 'Cutting Edge Supplies',
        location: 'Warehouse A - Shelf 8'
      },
      {
        name: 'Engine Oil (5L)',
        itemCode: 'OIL-ENG-5L',
        category: 'Consumables',
        description: 'SAE 15W-40 Engine oil for generators',
        currentStock: 20,
        minStock: 15,
        maxStock: 40,
        unitPrice: 75000,
        supplier: 'Shell Uganda',
        location: 'Chemical Store - Tank 2'
      },
      {
        name: 'Grease (5kg)',
        itemCode: 'GREASE-5KG',
        category: 'Consumables',
        description: 'Multipurpose lithium grease',
        currentStock: 10,
        minStock: 8,
        maxStock: 25,
        unitPrice: 45000,
        supplier: 'Total Uganda',
        location: 'Chemical Store - Shelf 1'
      },
      {
        name: 'Safety Gloves (Pair)',
        itemCode: 'PPE-GLOVE-001',
        category: 'PPE',
        description: 'Heavy duty work gloves',
        currentStock: 50,
        minStock: 30,
        maxStock: 100,
        unitPrice: 8000,
        supplier: 'Safety First Uganda',
        location: 'PPE Store - Bin 4'
      },
      {
        name: 'Safety Helmets',
        itemCode: 'PPE-HELMET-001',
        category: 'PPE',
        description: 'Industrial safety helmets',
        currentStock: 25,
        minStock: 20,
        maxStock: 50,
        unitPrice: 15000,
        supplier: 'Safety First Uganda',
        location: 'PPE Store - Rack 2'
      }
    ]);

    console.log(`   ✓ Created ${inventoryItems.length} inventory items`);

    // ========== MAINTENANCE ACTIVITIES ==========
    console.log('🔧 Creating maintenance activities...');
    const maintenanceActivities = await Maintenance.create([
      {
        title: 'Replace Air Filter - Composter Unit-A',
        description: 'Routine air filter replacement for 5 Tonne Composter. Old filter clogged, reducing efficiency.',
        machine: machines[0]._id,
        site: sites[0]._id,
        assignedTo: supervisor._id,
        status: 'completed',
        priority: 'medium',
        type: 'preventive',
        scheduledDate: new Date('2024-12-01'),
        completedDate: new Date('2024-12-02'),
        dueDate: new Date('2024-12-05'),
        estimatedDuration: 2,
        actualDuration: 1.5,
        materials: [
          { item: inventoryItems[0]._id, quantity: 1, unitCost: 45000 }
        ],
        laborCost: 50000,
        totalCost: 95000,
        notes: 'Filter replaced successfully. Machine running efficiently now.'
      },
      {
        title: 'Belt Replacement - Conveyor System',
        description: 'Emergency belt replacement on Buliisa conveyor system. Belt showing severe wear and tear.',
        machine: machines[3]._id,
        site: sites[1]._id,
        assignedTo: operator._id,
        status: 'in-progress',
        priority: 'high',
        type: 'corrective',
        scheduledDate: new Date('2024-12-10'),
        dueDate: new Date('2024-12-15'),
        estimatedDuration: 8,
        materials: [
          { item: inventoryItems[1]._id, quantity: 1, unitCost: 850000 }
        ],
        laborCost: 150000,
        totalCost: 1000000,
        notes: 'Work in progress. Belt ordered and delivered. Installation ongoing.'
      },
      {
        title: 'Hydraulic System Maintenance - Compactor',
        description: 'Scheduled hydraulic system check and oil change for industrial compactor.',
        machine: machines[4]._id,
        site: sites[2]._id,
        assignedTo: supervisor._id,
        status: 'pending',
        priority: 'medium',
        type: 'preventive',
        scheduledDate: new Date('2024-12-20'),
        dueDate: new Date('2024-12-25'),
        estimatedDuration: 4,
        materials: [
          { item: inventoryItems[2]._id, quantity: 2, unitCost: 120000 }
        ],
        laborCost: 80000,
        totalCost: 320000,
        notes: 'Routine maintenance scheduled. Parts available in stock.'
      },
      {
        title: 'Shredder Blade Replacement',
        description: 'Replace worn shredder blades on Tangi shredder machine. Blades dulled after 6 months operation.',
        machine: machines[1]._id,
        site: sites[0]._id,
        assignedTo: operator._id,
        status: 'completed',
        priority: 'high',
        type: 'preventive',
        scheduledDate: new Date('2024-11-25'),
        completedDate: new Date('2024-11-26'),
        dueDate: new Date('2024-11-30'),
        estimatedDuration: 6,
        actualDuration: 5,
        materials: [
          { item: inventoryItems[3]._id, quantity: 1, unitCost: 350000 }
        ],
        laborCost: 120000,
        totalCost: 470000,
        notes: 'Blades replaced. Machine tested and operating normally.'
      },
      {
        title: 'Generator Engine Overhaul',
        description: 'Complete engine overhaul for backup generator. Engine not starting, needs major repairs.',
        machine: machines[6]._id,
        site: sites[2]._id,
        assignedTo: manager._id,
        status: 'pending',
        priority: 'critical',
        type: 'corrective',
        scheduledDate: new Date('2024-12-18'),
        dueDate: new Date('2024-12-30'),
        estimatedDuration: 24,
        materials: [
          { item: inventoryItems[4]._id, quantity: 4, unitCost: 75000 }
        ],
        laborCost: 500000,
        totalCost: 800000,
        notes: 'Specialist technician required. Machine currently out of service.'
      },
      {
        title: 'Lubrication Service - All Machines',
        description: 'Monthly lubrication service for all moving parts across all sites.',
        site: sites[0]._id,
        assignedTo: operator._id,
        status: 'completed',
        priority: 'low',
        type: 'preventive',
        scheduledDate: new Date('2024-12-05'),
        completedDate: new Date('2024-12-06'),
        dueDate: new Date('2024-12-10'),
        estimatedDuration: 12,
        actualDuration: 10,
        materials: [
          { item: inventoryItems[5]._id, quantity: 3, unitCost: 45000 }
        ],
        laborCost: 100000,
        totalCost: 235000,
        notes: 'All machines greased and lubricated as per schedule.'
      }
    ]);

    console.log(`   ✓ Created ${maintenanceActivities.length} maintenance activities`);

    // ========== REQUISITIONS ==========
    console.log('📝 Creating requisitions...');
    const requisitions = await Requisition.create([
      {
        requisitionNumber: 'REQ-2024-001',
        requestedBy: operator._id,
        department: 'Maintenance',
        site: sites[0]._id,
        items: [
          { 
            inventoryItem: inventoryItems[2]._id,
            description: 'Hydraulic Oil for routine maintenance',
            quantity: 4,
            unitPrice: 120000,
            totalPrice: 480000
          }
        ],
        totalAmount: 480000,
        priority: 'medium',
        status: 'approved',
        requestDate: new Date('2024-12-08'),
        requiredDate: new Date('2024-12-15'),
        approvedBy: manager._id,
        approvalDate: new Date('2024-12-09'),
        notes: 'Approved for routine maintenance activities'
      },
      {
        requisitionNumber: 'REQ-2024-002',
        requestedBy: supervisor._id,
        department: 'Operations',
        site: sites[1]._id,
        items: [
          { 
            inventoryItem: inventoryItems[1]._id,
            description: 'Emergency conveyor belt replacement',
            quantity: 1,
            unitPrice: 850000,
            totalPrice: 850000
          }
        ],
        totalAmount: 850000,
        priority: 'high',
        status: 'approved',
        requestDate: new Date('2024-12-09'),
        requiredDate: new Date('2024-12-12'),
        approvedBy: admin._id,
        approvalDate: new Date('2024-12-09'),
        deliveryDate: new Date('2024-12-10'),
        notes: 'Urgent: Machine down, production affected'
      },
      {
        requisitionNumber: 'REQ-2024-003',
        requestedBy: operator._id,
        department: 'Safety',
        site: sites[2]._id,
        items: [
          { 
            inventoryItem: inventoryItems[6]._id,
            description: 'Safety gloves for maintenance team',
            quantity: 20,
            unitPrice: 8000,
            totalPrice: 160000
          },
          { 
            inventoryItem: inventoryItems[7]._id,
            description: 'Safety helmets for new staff',
            quantity: 10,
            unitPrice: 15000,
            totalPrice: 150000
          }
        ],
        totalAmount: 310000,
        priority: 'low',
        status: 'pending',
        requestDate: new Date('2024-12-12'),
        requiredDate: new Date('2024-12-20'),
        notes: 'PPE replenishment for Q1 2025'
      }
    ]);

    console.log(`   ✓ Created ${requisitions.length} requisitions`);

    // ========== SUMMARY ==========
    console.log('\n✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('========================================');
    console.log('📊 SUMMARY:');
    console.log('========================================');
    console.log(`👥 Users: ${4}`);
    console.log(`🏭 Sites: ${sites.length}`);
    console.log(`⚙️  Machines: ${machines.length}`);
    console.log(`📦 Inventory Items: ${inventoryItems.length}`);
    console.log(`🔧 Maintenance Activities: ${maintenanceActivities.length}`);
    console.log(`📝 Requisitions: ${requisitions.length}`);
    console.log('========================================\n');
    
    console.log('🔐 TEST ACCOUNTS:');
    console.log('========================================');
    console.log('Administrator:');
    console.log('  📧 Email: admin@sap-tech.com');
    console.log('  🔑 Password: admin123');
    console.log('');
    console.log('Manager:');
    console.log('  📧 Email: manager@sap-tech.com');
    console.log('  🔑 Password: manager123');
    console.log('');
    console.log('Supervisor:');
    console.log('  📧 Email: supervisor@sap-tech.com');
    console.log('  🔑 Password: supervisor123');
    console.log('');
    console.log('Operator:');
    console.log('  📧 Email: operator@sap-tech.com');
    console.log('  🔑 Password: operator123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
