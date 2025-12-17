const mongoose = require('mongoose');
const Site = require('../models/Site');
const Machine = require('../models/Machine');
require('dotenv').config();

const sites = [
  {
    name: 'TWSA Tangi',
    code: 'TWSA-TNG',
    location: {
      address: 'Tangi',
      city: 'Tangi',
      region: 'Western Region',
      country: 'Uganda'
    },
    type: 'waste_management',
    status: 'active',
    contactPerson: {
      name: 'Site Manager',
      phone: '+256-XXX-XXXXXX',
      email: 'tangi@twsa.ug'
    },
    operatingHours: {
      start: '08:00',
      end: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    description: 'TWSA Tangi waste management facility',
    capacity: 'Medium scale waste processing'
  },
  {
    name: 'TWSA Buliisa',
    code: 'TWSA-BLS',
    location: {
      address: 'Buliisa',
      city: 'Buliisa',
      region: 'Western Region',
      country: 'Uganda'
    },
    type: 'waste_management',
    status: 'active',
    contactPerson: {
      name: 'Site Manager',
      phone: '+256-XXX-XXXXXX',
      email: 'buliisa@twsa.ug'
    },
    operatingHours: {
      start: '08:00',
      end: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    description: 'TWSA Buliisa waste management facility',
    capacity: 'Large scale waste processing'
  },
  {
    name: 'TWSA DSB',
    code: 'TWSA-DSB',
    location: {
      address: 'DSB',
      city: 'Kampala',
      region: 'Central Region',
      country: 'Uganda'
    },
    type: 'waste_management',
    status: 'active',
    contactPerson: {
      name: 'Site Manager',
      phone: '+256-XXX-XXXXXX',
      email: 'dsb@twsa.ug'
    },
    operatingHours: {
      start: '08:00',
      end: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    description: 'TWSA DSB waste management facility',
    capacity: 'High capacity waste processing'
  }
];

const sampleMachines = [
  // Tangi Machines
  {
    siteName: 'TWSA Tangi',
    machines: [
      {
        name: '5 Tonne Composter',
        type: 'composter_5_tonne',
        serialNumber: 'TNG-COMP5T-001',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5 tonnes'],
          ['power', '15 kW'],
          ['voltage', '380V']
        ]),
        notes: 'Main composting unit for organic waste',
        installedDate: new Date('2023-01-15')
      },
      {
        name: '1 Tonne Composter',
        type: 'composter_1_tonne',
        serialNumber: 'TNG-COMP1T-001',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '1 tonne'],
          ['power', '5 kW'],
          ['voltage', '220V']
        ]),
        notes: 'Small scale composting unit',
        installedDate: new Date('2023-02-20')
      },
      {
        name: 'Industrial Shredder',
        type: 'shredder',
        serialNumber: 'TNG-SHRD-001',
        manufacturer: 'Heavy Machinery Co',
        status: 'operational',
        specifications: new Map([
          ['capacity', '500 kg/hr'],
          ['power', '20 kW'],
          ['blade_type', 'Industrial Grade']
        ]),
        notes: 'For shredding plastic and waste materials',
        installedDate: new Date('2023-03-10')
      },
      {
        name: 'Hydraulic Baler',
        type: 'baler',
        serialNumber: 'TNG-BALR-001',
        manufacturer: 'Press Systems Inc',
        status: 'operational',
        specifications: new Map([
          ['pressure', '150 tons'],
          ['power', '12 kW']
        ]),
        installedDate: new Date('2023-04-05')
      },
      {
        name: '5 Tonne Weighing Scale',
        type: 'weighing_scale',
        serialNumber: 'TNG-SCLE-001',
        manufacturer: 'Precision Scales Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5000 kg'],
          ['accuracy', '±1 kg']
        ]),
        installedDate: new Date('2023-01-10')
      },
      {
        name: 'Heavy Duty Trolley',
        type: 'trolley',
        serialNumber: 'TNG-TROL-001',
        status: 'operational',
        specifications: new Map([
          ['capacity', '500 kg']
        ]),
        installedDate: new Date('2023-01-10')
      },
      {
        name: 'Electric Pallet Jack',
        type: 'pallet_jack',
        serialNumber: 'TNG-PLJK-001',
        manufacturer: 'Logistics Equipment Co',
        status: 'operational',
        specifications: new Map([
          ['capacity', '2000 kg'],
          ['battery', '24V']
        ]),
        installedDate: new Date('2023-02-01')
      }
    ]
  },
  // Buliisa Machines
  {
    siteName: 'TWSA Buliisa',
    machines: [
      {
        name: '5 Tonne Composter - Unit 1',
        type: 'composter_5_tonne',
        serialNumber: 'BLS-COMP5T-001',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5 tonnes'],
          ['power', '15 kW']
        ]),
        installedDate: new Date('2022-11-20')
      },
      {
        name: '5 Tonne Composter - Unit 2',
        type: 'composter_5_tonne',
        serialNumber: 'BLS-COMP5T-002',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5 tonnes'],
          ['power', '15 kW']
        ]),
        installedDate: new Date('2022-11-20')
      },
      {
        name: '3 Tonne Composter',
        type: 'composter_3_tonne',
        serialNumber: 'BLS-COMP3T-001',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '3 tonnes'],
          ['power', '10 kW']
        ]),
        installedDate: new Date('2023-01-15')
      },
      {
        name: 'Heavy Duty Shredder',
        type: 'shredder',
        serialNumber: 'BLS-SHRD-001',
        manufacturer: 'Heavy Machinery Co',
        status: 'operational',
        specifications: new Map([
          ['capacity', '800 kg/hr'],
          ['power', '25 kW']
        ]),
        installedDate: new Date('2022-12-05')
      },
      {
        name: 'Industrial Baler',
        type: 'baler',
        serialNumber: 'BLS-BALR-001',
        manufacturer: 'Press Systems Inc',
        status: 'operational',
        installedDate: new Date('2023-02-10')
      },
      {
        name: 'Scissor Lift',
        type: 'scissor_lift',
        serialNumber: 'BLS-SCSL-001',
        manufacturer: 'Lift Equipment Ltd',
        status: 'operational',
        specifications: new Map([
          ['max_height', '10 meters'],
          ['capacity', '500 kg']
        ]),
        installedDate: new Date('2023-03-01')
      },
      {
        name: '10 Tonne Weighing Scale',
        type: 'weighing_scale',
        serialNumber: 'BLS-SCLE-001',
        manufacturer: 'Precision Scales Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '10000 kg'],
          ['accuracy', '±2 kg']
        ]),
        installedDate: new Date('2022-11-15')
      },
      {
        name: 'Pallet Jack - Unit 1',
        type: 'pallet_jack',
        serialNumber: 'BLS-PLJK-001',
        status: 'operational',
        installedDate: new Date('2022-11-20')
      },
      {
        name: 'Pallet Jack - Unit 2',
        type: 'pallet_jack',
        serialNumber: 'BLS-PLJK-002',
        status: 'operational',
        installedDate: new Date('2022-11-20')
      }
    ]
  },
  // DSB Machines
  {
    siteName: 'TWSA DSB',
    machines: [
      {
        name: '5 Tonne Composter - A',
        type: 'composter_5_tonne',
        serialNumber: 'DSB-COMP5T-A01',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5 tonnes'],
          ['power', '15 kW']
        ]),
        installedDate: new Date('2023-05-01')
      },
      {
        name: '5 Tonne Composter - B',
        type: 'composter_5_tonne',
        serialNumber: 'DSB-COMP5T-B01',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '5 tonnes'],
          ['power', '15 kW']
        ]),
        installedDate: new Date('2023-05-01')
      },
      {
        name: '3 Tonne Composter - Unit 1',
        type: 'composter_3_tonne',
        serialNumber: 'DSB-COMP3T-001',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        installedDate: new Date('2023-05-15')
      },
      {
        name: '3 Tonne Composter - Unit 2',
        type: 'composter_3_tonne',
        serialNumber: 'DSB-COMP3T-002',
        manufacturer: 'Waste Solutions Ltd',
        status: 'operational',
        installedDate: new Date('2023-05-15')
      },
      {
        name: '1 Tonne Composter',
        type: 'composter_1_tonne',
        serialNumber: 'DSB-COMP1T-001',
        status: 'operational',
        installedDate: new Date('2023-06-01')
      },
      {
        name: 'Industrial Shredder - Primary',
        type: 'shredder',
        serialNumber: 'DSB-SHRD-001',
        manufacturer: 'Heavy Machinery Co',
        status: 'operational',
        installedDate: new Date('2023-05-10')
      },
      {
        name: 'Industrial Shredder - Secondary',
        type: 'shredder',
        serialNumber: 'DSB-SHRD-002',
        manufacturer: 'Heavy Machinery Co',
        status: 'operational',
        installedDate: new Date('2023-05-10')
      },
      {
        name: 'Hydraulic Baler - Unit 1',
        type: 'baler',
        serialNumber: 'DSB-BALR-001',
        manufacturer: 'Press Systems Inc',
        status: 'operational',
        installedDate: new Date('2023-05-20')
      },
      {
        name: 'Hydraulic Baler - Unit 2',
        type: 'baler',
        serialNumber: 'DSB-BALR-002',
        manufacturer: 'Press Systems Inc',
        status: 'operational',
        installedDate: new Date('2023-05-20')
      },
      {
        name: 'Scissor Lift - Unit 1',
        type: 'scissor_lift',
        serialNumber: 'DSB-SCSL-001',
        manufacturer: 'Lift Equipment Ltd',
        status: 'operational',
        installedDate: new Date('2023-06-05')
      },
      {
        name: 'Scissor Lift - Unit 2',
        type: 'scissor_lift',
        serialNumber: 'DSB-SCSL-002',
        manufacturer: 'Lift Equipment Ltd',
        status: 'operational',
        installedDate: new Date('2023-06-05')
      },
      {
        name: '15 Tonne Weighing Scale',
        type: 'weighing_scale',
        serialNumber: 'DSB-SCLE-001',
        manufacturer: 'Precision Scales Ltd',
        status: 'operational',
        specifications: new Map([
          ['capacity', '15000 kg'],
          ['accuracy', '±5 kg']
        ]),
        installedDate: new Date('2023-05-01')
      },
      {
        name: 'Heavy Duty Trolley - Unit 1',
        type: 'trolley',
        serialNumber: 'DSB-TROL-001',
        status: 'operational',
        installedDate: new Date('2023-05-01')
      },
      {
        name: 'Heavy Duty Trolley - Unit 2',
        type: 'trolley',
        serialNumber: 'DSB-TROL-002',
        status: 'operational',
        installedDate: new Date('2023-05-01')
      },
      {
        name: 'Heavy Duty Trolley - Unit 3',
        type: 'trolley',
        serialNumber: 'DSB-TROL-003',
        status: 'operational',
        installedDate: new Date('2023-05-01')
      },
      {
        name: 'Electric Pallet Jack - Unit 1',
        type: 'pallet_jack',
        serialNumber: 'DSB-PLJK-001',
        manufacturer: 'Logistics Equipment Co',
        status: 'operational',
        installedDate: new Date('2023-05-05')
      },
      {
        name: 'Electric Pallet Jack - Unit 2',
        type: 'pallet_jack',
        serialNumber: 'DSB-PLJK-002',
        manufacturer: 'Logistics Equipment Co',
        status: 'operational',
        installedDate: new Date('2023-05-05')
      },
      {
        name: 'Electric Pallet Jack - Unit 3',
        type: 'pallet_jack',
        serialNumber: 'DSB-PLJK-003',
        manufacturer: 'Logistics Equipment Co',
        status: 'operational',
        installedDate: new Date('2023-05-05')
      }
    ]
  }
];

async function seedSites() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clear existing sites and machines (optional - comment out if you want to keep existing data)
    console.log('Clearing existing sites...');
    await Site.deleteMany({});
    console.log('✓ Cleared sites\n');

    // Create sites
    console.log('Creating sites...');
    const createdSites = [];
    for (const siteData of sites) {
      const site = new Site(siteData);
      await site.save();
      createdSites.push(site);
      console.log(`✓ Created site: ${site.name} (${site.code})`);
    }
    console.log(`\n✓ Created ${createdSites.length} sites\n`);

    // Create machines for each site
    console.log('Creating machines...');
    let totalMachines = 0;
    
    for (const siteGroup of sampleMachines) {
      const site = createdSites.find(s => s.name === siteGroup.siteName);
      
      if (!site) {
        console.log(`⚠️ Site not found: ${siteGroup.siteName}`);
        continue;
      }

      console.log(`\nAdding machines to ${site.name}:`);
      
      for (const machineData of siteGroup.machines) {
        const machine = new Machine({
          ...machineData,
          site: site._id
        });
        await machine.save();
        totalMachines++;
        console.log(`  ✓ ${machine.name} (${machine.type})`);
      }
    }

    console.log(`\n✓ Created ${totalMachines} machines across all sites\n`);

    // Display summary
    console.log('='.repeat(60));
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    for (const site of createdSites) {
      const machineCount = await Machine.countDocuments({ site: site._id });
      console.log(`${site.name} (${site.code}): ${machineCount} machines`);
    }
    
    console.log('='.repeat(60));
    console.log(`\nTotal Sites: ${createdSites.length}`);
    console.log(`Total Machines: ${totalMachines}`);
    console.log('\n✅ All done! You can now start using the system.\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedSites()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedSites };
