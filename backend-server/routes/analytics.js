const express = require('express');
const router = express.Router();
const ProductionReport = require('../models/ProductionReport');
const Machine = require('../models/Machine');
const Site = require('../models/Site');
const Maintenance = require('../models/maintenance');
const Inventory = require('../models/Inventory');
const Requisition = require('../models/Requisition');
const auth = require('../middleware/auth');

// Get overview analytics - Dashboard summary
router.get('/overview', auth, async (req, res) => {
  try {
    // Get counts
    const [machineCount, siteCount, maintenanceCount, inventoryCount, requisitionCount] = await Promise.all([
      Machine.countDocuments(),
      Site.countDocuments(),
      Maintenance.countDocuments(),
      Inventory.countDocuments(),
      Requisition.countDocuments()
    ]);

    // Get maintenance status breakdown
    const maintenanceByStatus = await Maintenance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get machines by status
    const machinesByStatus = await Machine.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get low stock items
    const lowStockItems = await Inventory.countDocuments({
      $expr: { $lte: ['$currentStock', '$reorderPoint'] }
    });

    // Get pending requisitions
    const pendingRequisitions = await Requisition.countDocuments({ status: 'pending' });

    // Get recent maintenance
    const recentMaintenance = await Maintenance.find()
      .populate('machineId', 'name')
      .populate('site', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      summary: {
        totalMachines: machineCount,
        totalSites: siteCount,
        totalMaintenance: maintenanceCount,
        totalInventory: inventoryCount,
        totalRequisitions: requisitionCount,
        lowStockItems,
        pendingRequisitions
      },
      maintenanceStatus: maintenanceByStatus,
      machineStatus: machinesByStatus,
      recentActivity: recentMaintenance
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ message: 'Error fetching overview analytics', error: error.message });
  }
});

// Get comprehensive production analytics
router.get('/production', auth, async (req, res) => {
  try {
    const { startDate, endDate, siteId } = req.query;
    
    // Build filter
    const filter = { status: 'approved' };
    if (siteId) filter.site = siteId;
    if (startDate || endDate) {
      filter['reportingPeriod.startDate'] = {};
      if (startDate) filter['reportingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) filter['reportingPeriod.startDate'].$lte = new Date(endDate);
    }
    
    const reports = await ProductionReport.find(filter)
      .populate('site', 'name code')
      .populate('machine', 'name type')
      .sort({ 'reportingPeriod.startDate': -1 });
    
    // Calculate overall statistics
    const totalInput = reports.reduce((sum, r) => sum + (r.summary.totalInput || 0), 0);
    const totalOutput = reports.reduce((sum, r) => sum + (r.summary.totalOutput || 0), 0);
    const totalDowntime = reports.reduce((sum, r) => sum + (r.summary.totalDowntime || 0), 0);
    const averageEfficiency = reports.length > 0 
      ? reports.reduce((sum, r) => sum + parseFloat(r.summary.efficiency || 0), 0) / reports.length 
      : 0;
    
    // Production trends (last 12 weeks)
    const productionTrends = [];
    const weeklyData = {};
    
    reports.forEach(report => {
      const weekKey = new Date(report.reportingPeriod.startDate).toISOString().split('T')[0];
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalOutput: 0,
          totalInput: 0,
          efficiency: 0,
          count: 0
        };
      }
      weeklyData[weekKey].totalOutput += report.summary.totalOutput;
      weeklyData[weekKey].totalInput += report.summary.totalInput;
      weeklyData[weekKey].efficiency += parseFloat(report.summary.efficiency || 0);
      weeklyData[weekKey].count += 1;
    });
    
    Object.values(weeklyData).forEach(data => {
      productionTrends.push({
        week: data.week,
        output: data.totalOutput,
        input: data.totalInput,
        efficiency: (data.efficiency / data.count).toFixed(2)
      });
    });
    
    res.json({
      overview: {
        totalReports: reports.length,
        totalInput,
        totalOutput,
        totalDowntime,
        averageEfficiency: averageEfficiency.toFixed(2)
      },
      productionTrends: productionTrends.slice(-12).sort((a, b) => new Date(a.week) - new Date(b.week))
    });
  } catch (error) {
    console.error('Error fetching production analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get site comparison analytics
router.get('/sites-comparison', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { status: 'approved' };
    if (startDate || endDate) {
      filter['reportingPeriod.startDate'] = {};
      if (startDate) filter['reportingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) filter['reportingPeriod.startDate'].$lte = new Date(endDate);
    }
    
    const reports = await ProductionReport.find(filter)
      .populate('site', 'name code type')
      .populate('machine', 'name type');
    
    // Group by site
    const siteData = {};
    
    reports.forEach(report => {
      const siteId = report.site?._id?.toString();
      if (!siteId) return;
      
      if (!siteData[siteId]) {
        siteData[siteId] = {
          siteName: report.site.name,
          siteCode: report.site.code,
          siteType: report.site.type,
          totalOutput: 0,
          totalInput: 0,
          totalDowntime: 0,
          reportCount: 0,
          efficiencySum: 0,
          machines: new Set()
        };
      }
      
      siteData[siteId].totalOutput += report.summary.totalOutput || 0;
      siteData[siteId].totalInput += report.summary.totalInput || 0;
      siteData[siteId].totalDowntime += report.summary.totalDowntime || 0;
      siteData[siteId].efficiencySum += parseFloat(report.summary.efficiency || 0);
      siteData[siteId].reportCount += 1;
      siteData[siteId].machines.add(report.machine?._id?.toString());
    });
    
    // Calculate averages and rankings
    const siteComparison = Object.values(siteData).map(site => ({
      siteName: site.siteName,
      siteCode: site.siteCode,
      siteType: site.siteType,
      totalOutput: site.totalOutput,
      totalInput: site.totalInput,
      totalDowntime: site.totalDowntime,
      averageEfficiency: (site.efficiencySum / site.reportCount).toFixed(2),
      reportsCount: site.reportCount,
      machinesCount: site.machines.size,
      outputPerMachine: (site.totalOutput / site.machines.size).toFixed(2),
      downtimeHours: (site.totalDowntime / 60).toFixed(2)
    }));
    
    // Sort by total output (most productive first)
    siteComparison.sort((a, b) => b.totalOutput - a.totalOutput);
    
    res.json({
      siteComparison,
      topPerformer: siteComparison[0],
      totalSites: siteComparison.length
    });
  } catch (error) {
    console.error('Error fetching site comparison:', error);
    res.status(500).json({ message: 'Error fetching site comparison', error: error.message });
  }
});

// Get machine performance analytics
router.get('/machines-performance', auth, async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    
    const filter = { status: 'approved' };
    if (siteId) filter.site = siteId;
    if (startDate || endDate) {
      filter['reportingPeriod.startDate'] = {};
      if (startDate) filter['reportingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) filter['reportingPeriod.startDate'].$lte = new Date(endDate);
    }
    
    const reports = await ProductionReport.find(filter)
      .populate('machine', 'name type code')
      .populate('site', 'name code');
    
    // Group by machine
    const machineData = {};
    
    reports.forEach(report => {
      const machineId = report.machine?._id?.toString();
      if (!machineId) return;
      
      if (!machineData[machineId]) {
        machineData[machineId] = {
          machineName: report.machine.name,
          machineType: report.machine.type,
          machineCode: report.machine.code,
          siteName: report.site?.name,
          totalOutput: 0,
          totalInput: 0,
          totalDowntime: 0,
          efficiencySum: 0,
          reportCount: 0
        };
      }
      
      machineData[machineId].totalOutput += report.summary.totalOutput || 0;
      machineData[machineId].totalInput += report.summary.totalInput || 0;
      machineData[machineId].totalDowntime += report.summary.totalDowntime || 0;
      machineData[machineId].efficiencySum += parseFloat(report.summary.efficiency || 0);
      machineData[machineId].reportCount += 1;
    });
    
    const machinePerformance = Object.values(machineData).map(machine => ({
      machineName: machine.machineName,
      machineType: machine.machineType,
      machineCode: machine.machineCode,
      siteName: machine.siteName,
      totalOutput: machine.totalOutput,
      averageEfficiency: (machine.efficiencySum / machine.reportCount).toFixed(2),
      downtimeHours: (machine.totalDowntime / 60).toFixed(2),
      reportsCount: machine.reportCount
    }));
    
    machinePerformance.sort((a, b) => b.totalOutput - a.totalOutput);
    
    res.json({
      machinePerformance,
      topMachine: machinePerformance[0],
      totalMachines: machinePerformance.length
    });
  } catch (error) {
    console.error('Error fetching machine performance:', error);
    res.status(500).json({ message: 'Error fetching machine performance', error: error.message });
  }
});

// Get maintenance analytics
router.get('/maintenance', auth, async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    
    const filter = {};
    if (siteId) filter.site = siteId;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }
    
    const maintenanceRecords = await Maintenance.find(filter)
      .populate('machine', 'name type')
      .populate('site', 'name code');
    
    // Calculate statistics
    const totalMaintenance = maintenanceRecords.length;
    const completedMaintenance = maintenanceRecords.filter(m => m.status === 'Completed').length;
    const pendingMaintenance = maintenanceRecords.filter(m => m.status === 'Pending').length;
    const totalCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);
    
    // Maintenance by type
    const maintenanceByType = {
      preventive: maintenanceRecords.filter(m => m.type === 'Preventive').length,
      corrective: maintenanceRecords.filter(m => m.type === 'Corrective').length,
      predictive: maintenanceRecords.filter(m => m.type === 'Predictive').length
    };
    
    // Maintenance by site
    const siteMaintenanceData = {};
    maintenanceRecords.forEach(record => {
      const siteId = record.site?._id?.toString();
      if (!siteId) return;
      
      if (!siteMaintenanceData[siteId]) {
        siteMaintenanceData[siteId] = {
          siteName: record.site.name,
          siteCode: record.site.code,
          count: 0,
          totalCost: 0,
          completed: 0
        };
      }
      
      siteMaintenanceData[siteId].count += 1;
      siteMaintenanceData[siteId].totalCost += record.cost || 0;
      if (record.status === 'Completed') siteMaintenanceData[siteId].completed += 1;
    });
    
    const maintenanceBySite = Object.values(siteMaintenanceData);
    
    res.json({
      overview: {
        totalMaintenance,
        completedMaintenance,
        pendingMaintenance,
        completionRate: totalMaintenance > 0 ? ((completedMaintenance / totalMaintenance) * 100).toFixed(2) : 0,
        totalCost
      },
      maintenanceByType,
      maintenanceBySite
    });
  } catch (error) {
    console.error('Error fetching maintenance analytics:', error);
    res.status(500).json({ message: 'Error fetching maintenance analytics', error: error.message });
  }
});

// Get efficiency trends
router.get('/efficiency-trends', auth, async (req, res) => {
  try {
    const { siteId, machineId } = req.query;
    
    const filter = { status: 'approved' };
    if (siteId) filter.site = siteId;
    if (machineId) filter.machine = machineId;
    
    const reports = await ProductionReport.find(filter)
      .populate('site', 'name')
      .populate('machine', 'name')
      .sort({ 'reportingPeriod.startDate': 1 })
      .limit(20);
    
    const efficiencyTrends = reports.map(report => ({
      week: new Date(report.reportingPeriod.startDate).toISOString().split('T')[0],
      efficiency: parseFloat(report.summary.efficiency || 0),
      output: report.summary.totalOutput,
      downtime: (report.summary.totalDowntime / 60).toFixed(2),
      siteName: report.site?.name,
      machineName: report.machine?.name
    }));
    
    res.json({ efficiencyTrends });
  } catch (error) {
    console.error('Error fetching efficiency trends:', error);
    res.status(500).json({ message: 'Error fetching efficiency trends', error: error.message });
  }
});

// Get dashboard summary (all key metrics)
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Production reports (last 30 days)
    const recentReports = await ProductionReport.find({
      status: 'approved',
      'reportingPeriod.startDate': { $gte: thirtyDaysAgo }
    }).populate('site', 'name');
    
    // Maintenance records (last 30 days)
    const recentMaintenance = await Maintenance.find({
      scheduledDate: { $gte: thirtyDaysAgo }
    });
    
    // Sites and machines count
    const totalSites = await Site.countDocuments({ status: 'active' });
    const totalMachines = await Machine.countDocuments({ status: { $in: ['operational', 'maintenance'] } });
    
    // Calculate KPIs
    const totalProduction = recentReports.reduce((sum, r) => sum + (r.summary.totalOutput || 0), 0);
    const avgEfficiency = recentReports.length > 0
      ? recentReports.reduce((sum, r) => sum + parseFloat(r.summary.efficiency || 0), 0) / recentReports.length
      : 0;
    
    const completedMaintenance = recentMaintenance.filter(m => m.status === 'Completed').length;
    const maintenanceCompletionRate = recentMaintenance.length > 0
      ? (completedMaintenance / recentMaintenance.length) * 100
      : 0;
    
    // Top performing site
    const siteProduction = {};
    recentReports.forEach(report => {
      const siteId = report.site?._id?.toString();
      if (!siteId) return;
      if (!siteProduction[siteId]) {
        siteProduction[siteId] = {
          siteName: report.site.name,
          totalOutput: 0
        };
      }
      siteProduction[siteId].totalOutput += report.summary.totalOutput || 0;
    });
    
    const topSite = Object.values(siteProduction).sort((a, b) => b.totalOutput - a.totalOutput)[0];
    
    res.json({
      kpis: {
        totalSites,
        totalMachines,
        totalProduction,
        averageEfficiency: avgEfficiency.toFixed(2),
        maintenanceCompletionRate: maintenanceCompletionRate.toFixed(2),
        activeReports: recentReports.length,
        pendingMaintenance: recentMaintenance.filter(m => m.status === 'Pending').length
      },
      topPerformer: topSite,
      period: '30 days'
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
});

module.exports = router;
