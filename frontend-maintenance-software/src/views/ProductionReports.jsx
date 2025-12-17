import React, { useState, useEffect } from 'react';
import ProductionReportService from '../services/production-report.service';
import MachineService from '../services/machine.service';
import siteService from '../services/site.service';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportToPDF, exportToWord } from '../utils/reportExportUtils';
import '../styles/pages/ProductionReports.css';

function ProductionReports() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [machines, setMachines] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filter, setFilter] = useState({
    site: '',
    machine: '',
    status: ''
  });

  // Form state for weekly report (7 days)
  const [formData, setFormData] = useState({
    imsId: 'AWM-MTN-RP092',
    version: 'V1.0',
    documentTitle: 'WEEKLY PRODUCTION REPORT',
    reportingPeriod: {
      startDate: '',
      endDate: ''
    },
    operators: [''],
    opsManager: '',
    supervisor: '',
    machine: '',
    site: '',
    dailyProduction: Array(7).fill(null).map(() => ({
      date: '',
      plannedTime: { hours: 0, minutes: 0 },
      startTime: { hours: 0, minutes: 0 },
      input: 0,
      stopTime: { hours: 0, minutes: 0 },
      output: 0,
      downtime: { hours: 0, minutes: 0 },
      usedTime: { hours: 0, minutes: 0 },
      reason: '',
      actionTaken: ''
    })),
    machineInspections: [],
    signatures: {
      operator: { name: '', position: '', date: '', signature: '' },
      supervisor: { name: '', position: '', date: '', signature: '' },
      manager: { name: '', position: '', date: '', signature: '' }
    },
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, machinesData, sitesData] = await Promise.all([
        ProductionReportService.getAll(filter),
        MachineService.getAll(),
        siteService.getAll()
      ]);
      
      setReports(reportsData);
      setMachines(machinesData);
      setSites(sitesData);
    } catch (error) {
      showToast('Error fetching data: ' + error.message, 'error');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      imsId: 'AWM-MTN-RP092',
      version: 'V1.0',
      documentTitle: 'WEEKLY PRODUCTION REPORT',
      reportingPeriod: {
        startDate: '',
        endDate: ''
      },
      operators: [''],
      opsManager: '',
      supervisor: '',
      machine: '',
      site: '',
      dailyProduction: Array(7).fill(null).map(() => ({
        date: '',
        plannedTime: { hours: 0, minutes: 0 },
        startTime: { hours: 0, minutes: 0 },
        input: 0,
        stopTime: { hours: 0, minutes: 0 },
        output: 0,
        downtime: { hours: 0, minutes: 0 },
        usedTime: { hours: 0, minutes: 0 },
        reason: '',
        actionTaken: ''
      })),
      machineInspections: [],
      signatures: {
        operator: { name: '', position: '', date: '', signature: '' },
        supervisor: { name: '', position: '', date: '', signature: '' },
        manager: { name: '', position: '', date: '', signature: '' }
      },
      notes: '',
      status: 'draft'
    });
  };

  const handleAddInspection = () => {
    setFormData(prev => ({
      ...prev,
      machineInspections: [...prev.machineInspections, {
        dateOfInspection: '',
        observationMade: '',
        supportRequired: '',
        reportedToWho: '',
        dateOfReporting: '',
        supportGiven: ''
      }]
    }));
  };

  const handleRemoveInspection = (index) => {
    setFormData(prev => ({
      ...prev,
      machineInspections: prev.machineInspections.filter((_, i) => i !== index)
    }));
  };

  const handleInspectionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      machineInspections: prev.machineInspections.map((inspection, i) =>
        i === index ? { ...inspection, [field]: value } : inspection
      )
    }));
  };

  const handleSignatureChange = (role, field, value) => {
    setFormData(prev => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [role]: {
          ...prev.signatures[role],
          [field]: value
        }
      }
    }));
  };

  const handleAddOperator = () => {
    setFormData(prev => ({
      ...prev,
      operators: [...prev.operators, '']
    }));
  };

  const handleRemoveOperator = (index) => {
    setFormData(prev => ({
      ...prev,
      operators: prev.operators.filter((_, i) => i !== index)
    }));
  };

  const handleOperatorChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      operators: prev.operators.map((op, i) => i === index ? value : op)
    }));
  };

  const handleDailyProductionChange = (dayIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      dailyProduction: prev.dailyProduction.map((day, i) => {
        if (i === dayIndex) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return {
              ...day,
              [parent]: {
                ...day[parent],
                [child]: value
              }
            };
          }
          return { ...day, [field]: value };
        }
        return day;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedReport) {
        await ProductionReportService.update(selectedReport._id, formData);
        showToast('Production report updated successfully', 'success');
      } else {
        await ProductionReportService.create(formData);
        showToast('Production report created successfully', 'success');
      }
      
      setShowModal(false);
      resetForm();
      setSelectedReport(null);
      fetchData();
    } catch (error) {
      showToast('Error saving production report: ' + error.message, 'error');
    }
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setFormData({
      imsId: report.imsId,
      version: report.version,
      documentTitle: report.documentTitle,
      reportingPeriod: {
        startDate: new Date(report.reportingPeriod.startDate).toISOString().split('T')[0],
        endDate: new Date(report.reportingPeriod.endDate).toISOString().split('T')[0]
      },
      operators: report.operators,
      opsManager: report.opsManager || '',
      supervisor: report.supervisor || '',
      machine: report.machine._id || report.machine,
      site: report.site._id || report.site,
      dailyProduction: report.dailyProduction.map(day => ({
        ...day,
        date: new Date(day.date).toISOString().split('T')[0]
      })),
      machineInspections: report.machineInspections?.map(inspection => ({
        ...inspection,
        dateOfInspection: inspection.dateOfInspection ? new Date(inspection.dateOfInspection).toISOString().split('T')[0] : '',
        dateOfReporting: inspection.dateOfReporting ? new Date(inspection.dateOfReporting).toISOString().split('T')[0] : ''
      })) || [],
      signatures: report.signatures || {
        operator: { name: '', position: '', date: '', signature: '' },
        supervisor: { name: '', position: '', date: '', signature: '' },
        manager: { name: '', position: '', date: '', signature: '' }
      },
      notes: report.notes || '',
      status: report.status
    });
    setViewMode(false);
    setShowModal(true);
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setFormData({
      imsId: report.imsId,
      version: report.version,
      documentTitle: report.documentTitle,
      reportingPeriod: {
        startDate: new Date(report.reportingPeriod.startDate).toISOString().split('T')[0],
        endDate: new Date(report.reportingPeriod.endDate).toISOString().split('T')[0]
      },
      operators: report.operators,
      opsManager: report.opsManager || '',
      supervisor: report.supervisor || '',
      machine: report.machine._id || report.machine,
      site: report.site._id || report.site,
      dailyProduction: report.dailyProduction.map(day => ({
        ...day,
        date: new Date(day.date).toISOString().split('T')[0]
      })),
      machineInspections: report.machineInspections?.map(inspection => ({
        ...inspection,
        dateOfInspection: inspection.dateOfInspection ? new Date(inspection.dateOfInspection).toISOString().split('T')[0] : '',
        dateOfReporting: inspection.dateOfReporting ? new Date(inspection.dateOfReporting).toISOString().split('T')[0] : ''
      })) || [],
      signatures: report.signatures || {
        operator: { name: '', position: '', date: '', signature: '' },
        supervisor: { name: '', position: '', date: '', signature: '' },
        manager: { name: '', position: '', date: '', signature: '' }
      },
      notes: report.notes || '',
      status: report.status
    });
    setViewMode(true);
    setShowModal(true);
  };

  const handleDeleteClick = (report) => {
    setSelectedReport(report);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ProductionReportService.delete(selectedReport._id);
      showToast('Production report deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showToast('Error deleting production report: ' + error.message, 'error');
    } finally {
      setShowDeleteDialog(false);
      setSelectedReport(null);
    }
  };

  const handleSubmitForReview = async (reportId) => {
    try {
      await ProductionReportService.submit(reportId);
      showToast('Report submitted for review', 'success');
      fetchData();
    } catch (error) {
      showToast('Error submitting report: ' + error.message, 'error');
    }
  };

  const handleApprove = async (reportId) => {
    try {
      await ProductionReportService.approve(reportId);
      showToast('Report approved successfully', 'success');
      fetchData();
    } catch (error) {
      showToast('Error approving report: ' + error.message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-draft',
      submitted: 'badge-warning',
      reviewed: 'badge-info',
      approved: 'badge-success'
    };
    return badges[status] || 'badge-secondary';
  };

  const canEdit = (report) => {
    return report.status === 'draft' || user.role === 'administrator';
  };

  const canApprove = (report) => {
    return (user.role === 'administrator' || user.role === 'manager') && report.status !== 'approved';
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) return <div className="loading">Loading production reports...</div>;

  return (
    <div className="production-reports-container">
      <div className="page-header">
        <h1>Production Reports</h1>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setSelectedReport(null);
          setViewMode(false);
          setShowModal(true);
        }}>
          + Create Weekly Report
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <select 
          value={filter.site} 
          onChange={(e) => setFilter(prev => ({ ...prev, site: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site._id} value={site._id}>{site.name} ({site.code})</option>
          ))}
        </select>

        <select 
          value={filter.machine} 
          onChange={(e) => setFilter(prev => ({ ...prev, machine: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Machines</option>
          {machines.map(machine => (
            <option key={machine._id} value={machine._id}>{machine.name}</option>
          ))}
        </select>

        <select 
          value={filter.status} 
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>IMS ID</th>
              <th>Reporting Period</th>
              <th>Machine</th>
              <th>Site</th>
              <th>Supervisor</th>
              <th>Total Output (Kg)</th>
              <th>Efficiency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No production reports found</td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report._id}>
                  <td>{report.imsId}</td>
                  <td>
                    {new Date(report.reportingPeriod.startDate).toLocaleDateString()} - {new Date(report.reportingPeriod.endDate).toLocaleDateString()}
                  </td>
                  <td>{report.machine?.name || 'N/A'}</td>
                  <td>{report.site?.name || 'N/A'}</td>
                  <td>{report.supervisor || 'N/A'}</td>
                  <td>{report.summary?.totalOutput || 0}</td>
                  <td>{report.summary?.efficiency || 0}%</td>
                  <td>
                    <span className={`badge ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-icon" onClick={() => handleView(report)} title="View">
                      👁️
                    </button>
                    <button 
                      className="btn-icon btn-info" 
                      onClick={() => exportToPDF(report)}
                      title="Export to PDF"
                    >
                      📄
                    </button>
                    <button 
                      className="btn-icon btn-info" 
                      onClick={() => exportToWord(report)}
                      title="Export to Word"
                    >
                      📝
                    </button>
                    {canEdit(report) && (
                      <button className="btn-icon" onClick={() => handleEdit(report)} title="Edit">
                        ✏️
                      </button>
                    )}
                    {report.status === 'draft' && (
                      <button 
                        className="btn-icon btn-success" 
                        onClick={() => handleSubmitForReview(report._id)}
                        title="Submit for Review"
                      >
                        📤
                      </button>
                    )}
                    {canApprove(report) && (
                      <button 
                        className="btn-icon btn-approve" 
                        onClick={() => handleApprove(report._id)}
                        title="Approve"
                      >
                        ✓
                      </button>
                    )}
                    {canEdit(report) && (
                      <button className="btn-icon btn-danger" onClick={() => handleDeleteClick(report)} title="Delete">
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        title={viewMode ? 'View Production Report' : (selectedReport ? 'Edit Production Report' : 'Create Weekly Production Report')}
        size="large"
        onClose={() => {
          setShowModal(false);
          resetForm();
          setSelectedReport(null);
          setViewMode(false);
        }}
      >
          <form onSubmit={handleSubmit} className="production-report-form">
            {/* Document Control Header */}
            <div className="form-section document-header">
              <div className="header-grid">
                <div>
                  <label>IMS ID</label>
                  <input 
                    type="text" 
                    value={formData.imsId} 
                    disabled
                    className="readonly-field"
                  />
                </div>
                <div>
                  <label>Version</label>
                  <input 
                    type="text" 
                    value={formData.version} 
                    disabled
                    className="readonly-field"
                  />
                </div>
                <div>
                  <label>Issue Date</label>
                  <input 
                    type="text" 
                    value={new Date().toLocaleDateString()} 
                    disabled
                    className="readonly-field"
                  />
                </div>
              </div>
            </div>

            {/* Report Information */}
            <div className="form-section">
              <h3>Report Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Reporting Period Start *</label>
                  <input
                    type="date"
                    value={formData.reportingPeriod.startDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reportingPeriod: { ...prev.reportingPeriod, startDate: e.target.value }
                    }))}
                    required
                    disabled={viewMode}
                  />
                </div>
                <div className="form-group">
                  <label>Reporting Period End *</label>
                  <input
                    type="date"
                    value={formData.reportingPeriod.endDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reportingPeriod: { ...prev.reportingPeriod, endDate: e.target.value }
                    }))}
                    required
                    disabled={viewMode}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Machine *</label>
                  <select
                    value={formData.machine}
                    onChange={(e) => setFormData(prev => ({ ...prev, machine: e.target.value }))}
                    required
                    disabled={viewMode}
                  >
                    <option value="">Select Machine</option>
                    {machines.map(machine => (
                      <option key={machine._id} value={machine._id}>
                        {machine.name} - {machine.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>TWSA (Site) *</label>
                  <select
                    value={formData.site}
                    onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                    required
                    disabled={viewMode}
                  >
                    <option value="">Select Site</option>
                    {sites.map(site => (
                      <option key={site._id} value={site._id}>
                        {site.name} - {site.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Personnel */}
            <div className="form-section">
              <h3>Personnel</h3>
              <div className="form-group">
                <label>Operator(s)</label>
                {formData.operators.map((operator, index) => (
                  <div key={index} className="operator-row">
                    <input
                      type="text"
                      value={operator}
                      onChange={(e) => handleOperatorChange(index, e.target.value)}
                      placeholder="Operator name"
                      disabled={viewMode}
                    />
                    {!viewMode && formData.operators.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveOperator(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {!viewMode && (
                  <button type="button" className="btn-secondary btn-sm" onClick={handleAddOperator}>
                    + Add Operator
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Operations Manager</label>
                  <input
                    type="text"
                    value={formData.opsManager}
                    onChange={(e) => setFormData(prev => ({ ...prev, opsManager: e.target.value }))}
                    placeholder="Manager name"
                    disabled={viewMode}
                  />
                </div>
                <div className="form-group">
                  <label>Supervisor</label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                    placeholder="Supervisor name"
                    disabled={viewMode}
                  />
                </div>
              </div>
            </div>

            {/* Daily Production Data */}
            <div className="form-section">
              <h3>Daily Production Data (7 Days)</h3>
              <div className="daily-production-table">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Date</th>
                      <th>Planned (H:M)</th>
                      <th>Start (H:M)</th>
                      <th>Input (Kg)</th>
                      <th>Stop (H:M)</th>
                      <th>Output (Kg)</th>
                      <th>Downtime (H:M)</th>
                      <th>Used (H:M)</th>
                      <th>Reason</th>
                      <th>Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.dailyProduction.map((day, index) => (
                      <tr key={index}>
                        <td>{daysOfWeek[index]}</td>
                        <td>
                          <input
                            type="date"
                            value={day.date}
                            onChange={(e) => handleDailyProductionChange(index, 'date', e.target.value)}
                            disabled={viewMode}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <div className="time-input">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={day.plannedTime.hours}
                              onChange={(e) => handleDailyProductionChange(index, 'plannedTime.hours', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                            :
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={day.plannedTime.minutes}
                              onChange={(e) => handleDailyProductionChange(index, 'plannedTime.minutes', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="time-input">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={day.startTime.hours}
                              onChange={(e) => handleDailyProductionChange(index, 'startTime.hours', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                            :
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={day.startTime.minutes}
                              onChange={(e) => handleDailyProductionChange(index, 'startTime.minutes', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={day.input}
                            onChange={(e) => handleDailyProductionChange(index, 'input', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <div className="time-input">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={day.stopTime.hours}
                              onChange={(e) => handleDailyProductionChange(index, 'stopTime.hours', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                            :
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={day.stopTime.minutes}
                              onChange={(e) => handleDailyProductionChange(index, 'stopTime.minutes', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={day.output}
                            onChange={(e) => handleDailyProductionChange(index, 'output', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <div className="time-input">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={day.downtime.hours}
                              onChange={(e) => handleDailyProductionChange(index, 'downtime.hours', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                            :
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={day.downtime.minutes}
                              onChange={(e) => handleDailyProductionChange(index, 'downtime.minutes', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="time-input">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={day.usedTime.hours}
                              onChange={(e) => handleDailyProductionChange(index, 'usedTime.hours', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                            :
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={day.usedTime.minutes}
                              onChange={(e) => handleDailyProductionChange(index, 'usedTime.minutes', parseInt(e.target.value) || 0)}
                              disabled={viewMode}
                              className="input-xs"
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={day.reason}
                            onChange={(e) => handleDailyProductionChange(index, 'reason', e.target.value)}
                            placeholder="Why stopped?"
                            disabled={viewMode}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={day.actionTaken}
                            onChange={(e) => handleDailyProductionChange(index, 'actionTaken', e.target.value)}
                            placeholder="Action taken"
                            disabled={viewMode}
                            className="input-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Machine Inspections */}
            <div className="form-section">
              <div className="section-header">
                <h3>Daily Machine Inspections</h3>
                {!viewMode && (
                  <button type="button" className="btn-secondary btn-sm" onClick={handleAddInspection}>
                    + Add Inspection
                  </button>
                )}
              </div>
              
              {formData.machineInspections.length === 0 ? (
                <p className="no-data-message">No machine inspections added yet.</p>
              ) : (
                <div className="inspections-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date of Inspection</th>
                        <th>Observation Made</th>
                        <th>Support Required</th>
                        <th>Reported to Who?</th>
                        <th>Date of Reporting</th>
                        <th>Support Given</th>
                        {!viewMode && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.machineInspections.map((inspection, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="date"
                              value={inspection.dateOfInspection}
                              onChange={(e) => handleInspectionChange(index, 'dateOfInspection', e.target.value)}
                              disabled={viewMode}
                              className="input-sm"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={inspection.observationMade}
                              onChange={(e) => handleInspectionChange(index, 'observationMade', e.target.value)}
                              placeholder="What was observed?"
                              disabled={viewMode}
                              className="input-md"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={inspection.supportRequired}
                              onChange={(e) => handleInspectionChange(index, 'supportRequired', e.target.value)}
                              placeholder="Support needed"
                              disabled={viewMode}
                              className="input-md"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={inspection.reportedToWho}
                              onChange={(e) => handleInspectionChange(index, 'reportedToWho', e.target.value)}
                              placeholder="Person/Department"
                              disabled={viewMode}
                              className="input-sm"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={inspection.dateOfReporting}
                              onChange={(e) => handleInspectionChange(index, 'dateOfReporting', e.target.value)}
                              disabled={viewMode}
                              className="input-sm"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={inspection.supportGiven}
                              onChange={(e) => handleInspectionChange(index, 'supportGiven', e.target.value)}
                              placeholder="Support provided"
                              disabled={viewMode}
                              className="input-md"
                            />
                          </td>
                          {!viewMode && (
                            <td>
                              <button
                                type="button"
                                className="btn-icon btn-danger"
                                onClick={() => handleRemoveInspection(index)}
                                title="Remove inspection"
                              >
                                🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional comments or observations..."
                  rows="4"
                  disabled={viewMode}
                />
              </div>
            </div>

            {/* Signatures Section */}
            <div className="form-section">
              <h3>Approvals & Signatures</h3>
              <div className="signatures-grid">
                {/* Operator Signature */}
                <div className="signature-block">
                  <h4>Operator</h4>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.signatures.operator.name}
                      onChange={(e) => handleSignatureChange('operator', 'name', e.target.value)}
                      placeholder="Operator name"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={formData.signatures.operator.position}
                      onChange={(e) => handleSignatureChange('operator', 'position', e.target.value)}
                      placeholder="Position"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={formData.signatures.operator.date}
                      onChange={(e) => handleSignatureChange('operator', 'date', e.target.value)}
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Signature</label>
                    <input
                      type="text"
                      value={formData.signatures.operator.signature}
                      onChange={(e) => handleSignatureChange('operator', 'signature', e.target.value)}
                      placeholder="Signature/Initials"
                      disabled={viewMode}
                    />
                  </div>
                </div>

                {/* Supervisor Signature */}
                <div className="signature-block">
                  <h4>Supervisor</h4>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.signatures.supervisor.name}
                      onChange={(e) => handleSignatureChange('supervisor', 'name', e.target.value)}
                      placeholder="Supervisor name"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={formData.signatures.supervisor.position}
                      onChange={(e) => handleSignatureChange('supervisor', 'position', e.target.value)}
                      placeholder="Position"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={formData.signatures.supervisor.date}
                      onChange={(e) => handleSignatureChange('supervisor', 'date', e.target.value)}
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Signature</label>
                    <input
                      type="text"
                      value={formData.signatures.supervisor.signature}
                      onChange={(e) => handleSignatureChange('supervisor', 'signature', e.target.value)}
                      placeholder="Signature/Initials"
                      disabled={viewMode}
                    />
                  </div>
                </div>

                {/* Manager Signature */}
                <div className="signature-block">
                  <h4>Manager</h4>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.signatures.manager.name}
                      onChange={(e) => handleSignatureChange('manager', 'name', e.target.value)}
                      placeholder="Manager name"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={formData.signatures.manager.position}
                      onChange={(e) => handleSignatureChange('manager', 'position', e.target.value)}
                      placeholder="Position"
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={formData.signatures.manager.date}
                      onChange={(e) => handleSignatureChange('manager', 'date', e.target.value)}
                      disabled={viewMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Signature</label>
                    <input
                      type="text"
                      value={formData.signatures.manager.signature}
                      onChange={(e) => handleSignatureChange('manager', 'signature', e.target.value)}
                      placeholder="Signature/Initials"
                      disabled={viewMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            {!viewMode && (
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setSelectedReport(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedReport ? 'Update Report' : 'Create Report'}
                </button>
              </div>
            )}
            
            {/* View Mode Actions */}
            {viewMode && selectedReport && (
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => exportToPDF(selectedReport)}
                >
                  📄 Export to PDF
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => exportToWord(selectedReport)}
                >
                  📝 Export to Word
                </button>
                <button type="button" className="btn-primary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setSelectedReport(null);
                  setViewMode(false);
                }}>
                  Close
                </button>
              </div>
            )}
          </form>
        </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedReport(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Production Report"
        message={`Are you sure you want to delete this production report? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default ProductionReports;
