const express = require('express');
const router = express.Router();
const ProductionReport = require('../models/ProductionReport');
const Machine = require('../models/Machine');
const auth = require('../middleware/auth');
const { checkPermission, isManagerOrAdmin } = require('../middleware/permissions');

// Get all production reports with filters
router.get('/', auth, async (req, res) => {
  try {
    const { site, machine, status, startDate, endDate } = req.query;
    const filter = {};
    
    if (site) filter.site = site;
    if (machine) filter.machine = machine;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter['reportingPeriod.startDate'] = {};
      if (startDate) filter['reportingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) filter['reportingPeriod.startDate'].$lte = new Date(endDate);
    }
    
    const reports = await ProductionReport.find(filter)
      .populate('machine', 'name code type')
      .populate('site', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ 'reportingPeriod.startDate': -1 })
      .lean();
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching production reports:', error);
    res.status(500).json({ message: 'Error fetching production reports', error: error.message });
  }
});

// Get single production report by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await ProductionReport.findById(req.params.id)
      .populate('machine', 'name code type model serialNumber')
      .populate('site', 'name code location')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role');
    
    if (!report) {
      return res.status(404).json({ message: 'Production report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching production report:', error);
    res.status(500).json({ message: 'Error fetching production report', error: error.message });
  }
});

// Create new production report
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating production report with data:', req.body);
    
    const {
      reportingPeriod,
      operators,
      opsManager,
      supervisor,
      machine,
      site,
      dailyProduction,
      machineInspections,
      signatures,
      notes
    } = req.body;
    
    // Validate required fields
    if (!reportingPeriod || !reportingPeriod.startDate || !reportingPeriod.endDate) {
      return res.status(400).json({ message: 'Reporting period is required' });
    }
    
    if (!machine) {
      return res.status(400).json({ message: 'Machine is required' });
    }
    
    if (!site) {
      return res.status(400).json({ message: 'Site is required' });
    }
    
    // Verify machine exists
    const machineExists = await Machine.findById(machine);
    if (!machineExists) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Calculate next review date (1 year from issue date)
    const issueDate = new Date();
    const nextReview = new Date(issueDate);
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    
    const report = new ProductionReport({
      reportingPeriod,
      operators: operators || [],
      opsManager,
      supervisor,
      machine,
      site,
      dailyProduction: dailyProduction || [],
      machineInspections: machineInspections || [],
      signatures: signatures || {
        operator: {},
        supervisor: {},
        manager: {}
      },
      notes,
      issueDate,
      nextReview,
      createdBy: req.user.id,
      status: 'draft'
    });
    
    await report.save();
    
    const populatedReport = await ProductionReport.findById(report._id)
      .populate('machine', 'name code')
      .populate('site', 'name code')
      .populate('createdBy', 'name email');
    
    console.log('Production report created successfully:', populatedReport._id);
    res.status(201).json(populatedReport);
  } catch (error) {
    console.error('Error creating production report:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error creating production report', error: error.message });
  }
});

// Update production report
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating production report:', req.params.id);
    
    const report = await ProductionReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Production report not found' });
    }
    
    // Don't allow editing approved reports unless admin
    if (report.status === 'approved' && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Cannot edit approved reports' });
    }
    
    const {
      reportingPeriod,
      operators,
      opsManager,
      supervisor,
      machine,
      site,
      dailyProduction,
      machineInspections,
      signatures,
      notes,
      status
    } = req.body;
    
    // Update fields
    if (reportingPeriod) report.reportingPeriod = reportingPeriod;
    if (operators) report.operators = operators;
    if (opsManager !== undefined) report.opsManager = opsManager;
    if (supervisor !== undefined) report.supervisor = supervisor;
    if (machine) report.machine = machine;
    if (site) report.site = site;
    if (dailyProduction) report.dailyProduction = dailyProduction;
    if (machineInspections !== undefined) report.machineInspections = machineInspections;
    if (signatures !== undefined) report.signatures = signatures;
    if (notes !== undefined) report.notes = notes;
    if (status) report.status = status;
    
    await report.save();
    
    const updatedReport = await ProductionReport.findById(report._id)
      .populate('machine', 'name code')
      .populate('site', 'name code')
      .populate('createdBy', 'name email');
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating production report:', error);
    res.status(500).json({ message: 'Error updating production report', error: error.message });
  }
});

// Submit report for review
router.patch('/:id/submit', auth, async (req, res) => {
  try {
    const report = await ProductionReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Production report not found' });
    }
    
    if (report.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft reports can be submitted' });
    }
    
    report.status = 'submitted';
    await report.save();
    
    res.json({ message: 'Report submitted for review', report });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Error submitting report', error: error.message });
  }
});

// Approve production report (Manager/Admin only)
router.patch('/:id/approve', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const report = await ProductionReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Production report not found' });
    }
    
    if (report.status === 'approved') {
      return res.status(400).json({ message: 'Report is already approved' });
    }
    
    report.status = 'approved';
    report.approvedBy = req.user.id;
    report.approvedAt = new Date();
    
    await report.save();
    
    const approvedReport = await ProductionReport.findById(report._id)
      .populate('machine', 'name code')
      .populate('site', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    res.json({ message: 'Report approved successfully', report: approvedReport });
  } catch (error) {
    console.error('Error approving report:', error);
    res.status(500).json({ message: 'Error approving report', error: error.message });
  }
});

// Delete production report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await ProductionReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Production report not found' });
    }
    
    // Don't allow deleting approved reports unless admin
    if (report.status === 'approved' && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Cannot delete approved reports' });
    }
    
    await ProductionReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Production report deleted successfully' });
  } catch (error) {
    console.error('Error deleting production report:', error);
    res.status(500).json({ message: 'Error deleting production report', error: error.message });
  }
});

// Get production summary/statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { site, machine, startDate, endDate } = req.query;
    const filter = { status: 'approved' };
    
    if (site) filter.site = site;
    if (machine) filter.machine = machine;
    if (startDate || endDate) {
      filter['reportingPeriod.startDate'] = {};
      if (startDate) filter['reportingPeriod.startDate'].$gte = new Date(startDate);
      if (endDate) filter['reportingPeriod.startDate'].$lte = new Date(endDate);
    }
    
    const reports = await ProductionReport.find(filter);
    
    const stats = {
      totalReports: reports.length,
      totalInput: 0,
      totalOutput: 0,
      totalDowntime: 0,
      averageEfficiency: 0,
      machines: {}
    };
    
    reports.forEach(report => {
      stats.totalInput += report.summary.totalInput;
      stats.totalOutput += report.summary.totalOutput;
      stats.totalDowntime += report.summary.totalDowntime;
      stats.averageEfficiency += parseFloat(report.summary.efficiency);
    });
    
    if (reports.length > 0) {
      stats.averageEfficiency = (stats.averageEfficiency / reports.length).toFixed(2);
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching production stats:', error);
    res.status(500).json({ message: 'Error fetching production stats', error: error.message });
  }
});

module.exports = router;
