// Dashboard View - Professional dashboard with stats, charts, and recent activities
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MachineService from '../services/machine.service';
import MaintenanceService from '../services/maintenance.service';
import InventoryService from '../services/inventory.service';
import RequisitionService from '../services/requisition.service';
import UserService from '../services/user.service';
import { useToast } from '../contexts/ToastContext';
import VisitorDashboard from '../components/VisitorDashboard';
import Charts from '../components/Charts';
import '../styles/pages/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dateRange, setDateRange] = useState('all'); // user can filter by: all, today, week, month
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef(null);
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeMachines: 0,
    underMaintenance: 0,
    pendingMaintenance: 0,
    completedMaintenance: 0,
    totalInventoryItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalRequisitions: 0,
    pendingRequisitions: 0,
    approvedRequisitions: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalSites: 0,
    // Trend data (vs previous period)
    machinesTrend: 0,
    maintenanceTrend: 0,
    inventoryTrend: 0,
    requisitionsTrend: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState([]);
  const [machineStatusBreakdown, setMachineStatusBreakdown] = useState({});
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [chartData, setChartData] = useState({
    maintenanceByStatus: [],
    machinesByStatus: [],
    maintenanceTrend: [],
  });
  
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardData(true);
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [dateRange, autoRefresh]);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const promises = [
        MachineService.getAll(),
        MaintenanceService.getAll(),
        InventoryService.getAll(),
        RequisitionService.getAll(),
      ];
      
      // Add user stats for admins/managers
      if (user?.role === 'administrator' || user?.role === 'manager') {
        promises.push(UserService.getStats());
      }
      
      const results = await Promise.all(promises);
      const [machines, maintenance, inventory, requisitions, userStats] = results;

      // Filter data by date range
      const filteredMaintenance = filterByDateRange(maintenance);
      const filteredRequisitions = filterByDateRange(requisitions);

      // Calculate stats
      const machineStats = calculateMachineStats(machines);
      const maintenanceStats = calculateMaintenanceStats(filteredMaintenance, maintenance);
      const inventoryStats = calculateInventoryStats(inventory);
      const requisitionStats = calculateRequisitionStats(filteredRequisitions, requisitions);

      setStats({
        ...machineStats,
        ...maintenanceStats,
        ...inventoryStats,
        ...requisitionStats,
        totalUsers: userStats?.totalUsers || 0,
        activeUsers: userStats?.activeUsers || 0,
        totalSites: userStats?.totalSites || 0,
      });

      // Get recent activities (last 10 maintenance records)
      const sortedMaintenance = [...maintenance]
        .sort((a, b) => new Date(b.createdAt || b.scheduledDate) - new Date(a.createdAt || a.scheduledDate))
        .slice(0, 10);
      setRecentActivities(sortedMaintenance);

      // Get low stock items
      const lowStock = inventory.filter(item => item.currentStock <= item.minStock);
      setLowStockItems(lowStock.slice(0, 5));

      // Get upcoming maintenance (next 7 days)
      const upcoming = maintenance
        .filter(m => {
          if (!m.scheduledDate || m.status === 'completed' || m.status === 'cancelled') return false;
          const scheduledDate = new Date(m.scheduledDate);
          const now = new Date();
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(now.getDate() + 7);
          return scheduledDate >= now && scheduledDate <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
        .slice(0, 5);
      setUpcomingMaintenance(upcoming);

      // Machine status breakdown
      const statusBreakdown = machines.reduce((acc, machine) => {
        const status = machine.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setMachineStatusBreakdown(statusBreakdown);

      // Find overdue maintenance
      const overdue = filteredMaintenance.filter(m => 
        m.status !== 'completed' && m.status !== 'cancelled' && m.scheduledDate && new Date(m.scheduledDate) < new Date()
      );
      setOverdueMaintenance(overdue);

      // Generate critical alerts
      const alerts = [];
      if (overdue.length > 0) {
        alerts.push({ type: 'danger', message: `${overdue.length} overdue maintenance task${overdue.length > 1 ? 's' : ''}`, count: overdue.length });
      }
      if (lowStock.length > 5) {
        alerts.push({ type: 'warning', message: `${lowStock.length} low stock item${lowStock.length > 1 ? 's' : ''}`, count: lowStock.length });
      }
      const criticalMachines = machines.filter(m => m.status === 'critical' || m.status === 'out-of-service');
      if (criticalMachines.length > 0) {
        alerts.push({ type: 'danger', message: `${criticalMachines.length} machine${criticalMachines.length > 1 ? 's' : ''} need attention`, count: criticalMachines.length });
      }
      setCriticalAlerts(alerts);

      // Prepare chart data
      setChartData({
        machineStatus: {
          labels: ['Operational', 'Under Maintenance', 'Critical', 'Out of Service'],
          values: [
            machines.filter(m => m.status === 'operational').length,
            machines.filter(m => m.status === 'under-maintenance').length,
            machines.filter(m => m.status === 'critical').length,
            machines.filter(m => m.status === 'out-of-service').length
          ],
          colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280']
        },
        maintenanceStatus: {
          labels: ['Pending', 'In Progress', 'Completed'],
          values: [
            filteredMaintenance.filter(m => m.status === 'pending').length,
            filteredMaintenance.filter(m => m.status === 'in-progress').length,
            filteredMaintenance.filter(m => m.status === 'completed').length
          ],
          colors: ['#f59e0b', '#3b82f6', '#10b981']
        },
        inventoryStatus: {
          labels: ['In Stock', 'Low Stock', 'Out of Stock'],
          values: [
            inventory.filter(i => i.currentStock > i.minStock).length,
            inventory.filter(i => i.currentStock <= i.minStock && i.currentStock > 0).length,
            inventory.filter(i => i.currentStock === 0).length
          ],
          colors: ['#10b981', '#f59e0b', '#ef4444']
        }
      });

      setLastUpdated(new Date());
      setError(null);

    } catch (error) {
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = (data) => {
    if (dateRange === 'all') return data;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch(dateRange) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.scheduledDate || item.date);
      return itemDate >= filterDate;
    });
  };

  const calculateMachineStats = (machines) => {
    return {
      totalMachines: machines.length,
      activeMachines: machines.filter(m => m.status === 'operational').length,
      underMaintenance: machines.filter(m => m.status === 'under-maintenance').length,
      operationalMachines: machines.filter(m => m.status === 'operational').length,
      criticalMachines: machines.filter(m => m.status === 'critical' || m.status === 'out-of-service').length,
    };
  };

  const calculateMaintenanceStats = (filteredMaintenance, allMaintenance) => {
    // Calculate current period stats
    const current = {
      pending: filteredMaintenance.filter(m => m.status === 'pending').length,
      completed: filteredMaintenance.filter(m => m.status === 'completed').length,
      total: filteredMaintenance.length
    };
    
    // Calculate previous period for trends
    const previous = calculatePreviousPeriod(allMaintenance);
    
    return {
      pendingMaintenance: current.pending,
      completedMaintenance: current.completed,
      maintenanceTrend: calculateTrend(current.total, previous.total)
    };
  };

  const calculateInventoryStats = (inventory) => {
    const lowStock = inventory.filter(item => item.currentStock <= item.minStock && item.currentStock > 0);
    const outOfStock = inventory.filter(item => item.currentStock === 0);
    
    return {
      totalInventoryItems: inventory.length,
      lowStockItems: lowStock.length,
      outOfStockItems: outOfStock.length,
      inventoryTrend: 0 // Can be enhanced with historical data
    };
  };

  const calculateRequisitionStats = (filteredRequisitions, allRequisitions) => {
    const current = {
      pending: filteredRequisitions.filter(r => r.status === 'pending').length,
      approved: filteredRequisitions.filter(r => r.status === 'approved').length,
      total: filteredRequisitions.length
    };
    
    const previous = calculatePreviousPeriod(allRequisitions);
    
    return {
      totalRequisitions: current.total,
      pendingRequisitions: current.pending,
      approvedRequisitions: current.approved,
      requisitionsTrend: calculateTrend(current.total, previous.total)
    };
  };

  const calculatePreviousPeriod = (data) => {
    if (dateRange === 'all') return { total: data.length };
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch(dateRange) {
      case 'today':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 14);
        endDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 2);
        endDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return { total: 0 };
    }
    
    const filtered = data.filter(item => {
      const itemDate = new Date(item.createdAt || item.scheduledDate || item.date);
      return itemDate >= startDate && itemDate < endDate;
    });
    
    return { total: filtered.length };
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return `badge ${statusMap[status] || 'badge-secondary'}`;
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger',
      urgent: 'badge-danger',
    };
    return `badge ${priorityMap[priority] || 'badge-secondary'}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusPercentage = (status) => {
    const total = stats.totalMachines || 1;
    const count = machineStatusBreakdown[status] || 0;
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">
          <div className="spinner spinner-primary"></div>
          <p>Loading dashboard......</p>
        </div>
      </div>
    );
  }

  // Show visitor dashboard for users with visitor role
  if (user?.role === 'visitor') {
    return <VisitorDashboard />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>
            {user?.name ? `Welcome back, ${user.name}` : 'Dashboard'}
          </h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {lastUpdated && (
              <span className="last-updated">
                · Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="dashboard-actions">
          <div className="date-range-selector">
            <button 
              className={`btn btn-sm ${dateRange === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDateRange('all')}
            >
              All Time
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDateRange('today')}
            >
              Today
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDateRange('week')}
            >
              Week
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDateRange('month')}
            >
              Month
            </button>
          </div>
          <button 
            className={`btn btn-sm ${autoRefresh ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          <Link to="/machines" className="btn btn-outline-primary btn-sm">
            View Machines
          </Link>
          <Link to="/maintenance" className="btn btn-outline-primary btn-sm">
            View Maintenance
          </Link>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="critical-alerts-section">
          {criticalAlerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.type}`}>
              <strong>⚠</strong> {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Debug Test Section - Admin Only */}
      {(user?.role === 'administrator' || user?.role === 'manager') && (
        <div className="debug-test-section">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <h3>🔍 System Debug & Test Panel</h3>
            </div>
            <div className="card-body">
              <div className="debug-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="debug-item">
                  <strong>Current User:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Name: {user?.name}</div>
                    <div>Email: {user?.email}</div>
                    <div>Role: <span className="badge badge-primary">{user?.role}</span></div>
                    <div>Assigned Sites: {user?.assignedSites?.length || 0}</div>
                  </div>
                </div>
                
                <div className="debug-item">
                  <strong>System Stats:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Total Machines: {stats.totalMachines}</div>
                    <div>Active Machines: {stats.activeMachines}</div>
                    <div>Under Maintenance: {stats.underMaintenance}</div>
                    <div>Pending Tasks: {stats.pendingMaintenance}</div>
                  </div>
                </div>
                
                <div className="debug-item">
                  <strong>Inventory Status:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Total Items: {stats.totalInventoryItems}</div>
                    <div>Low Stock: <span className="badge badge-warning">{stats.lowStockItems}</span></div>
                    <div>Out of Stock: <span className="badge badge-danger">{stats.outOfStockItems}</span></div>
                  </div>
                </div>
                
                <div className="debug-item">
                  <strong>Requisitions:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Total: {stats.totalRequisitions}</div>
                    <div>Pending: <span className="badge badge-info">{stats.pendingRequisitions}</span></div>
                    <div>Approved: <span className="badge badge-success">{stats.approvedRequisitions}</span></div>
                  </div>
                </div>

                <div className="debug-item">
                  <strong>User Management:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Total Users: {stats.totalUsers}</div>
                    <div>Active Users: {stats.activeUsers}</div>
                    <div>Total Sites: {stats.totalSites}</div>
                  </div>
                </div>
                
                <div className="debug-item">
                  <strong>Date Range Filter:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Current Filter: <span className="badge badge-secondary">{dateRange}</span></div>
                    <div>Auto-refresh: {autoRefresh ? '✓ ON' : '✗ OFF'}</div>
                    <div>Last Updated: {lastUpdated.toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="debug-item">
                  <strong>System Status:</strong>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div>Loading: {loading ? '⏳ Yes' : '✓ No'}</div>
                    <div>Error: {error ? '⚠ Yes' : '✓ No'}</div>
                    <div>Critical Alerts: {criticalAlerts.length}</div>
                  </div>
                </div>

                <div className="debug-item">
                  <strong>Quick Tests:</strong>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button 
                      className="btn btn-sm btn-outline-info"
                      onClick={() => {
                        console.log('Dashboard State:', { stats, user, dateRange, autoRefresh });
                        toast.success('State logged to console');
                      }}
                    >
                      Log State to Console
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-success"
                      onClick={() => {
                        fetchDashboardData();
                        toast.success('Dashboard data refreshed');
                      }}
                    >
                      Force Refresh Data
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => {
                        console.log('Recent Activities:', recentActivities);
                        console.log('Low Stock Items:', lowStockItems);
                        console.log('Upcoming Maintenance:', upcomingMaintenance);
                        toast.success('Activity data logged');
                      }}
                    >
                      Log Activities
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <div className="stat-label">Total Machines</div>
            <div className="stat-value">{stats.totalMachines}</div>
            <div className="stat-detail">
              {stats.activeMachines} operational
            </div>
            {stats.machinesTrend !== undefined && stats.machinesTrend !== 0 && (
              <div className={`stat-trend ${stats.machinesTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                {stats.machinesTrend > 0 ? '↑' : '↓'} {Math.abs(stats.machinesTrend)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completedMaintenance}</div>
            <div className="stat-detail">maintenance tasks</div>
            {stats.maintenanceTrend !== undefined && stats.maintenanceTrend !== 0 && (
              <div className={`stat-trend ${stats.maintenanceTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                {stats.maintenanceTrend > 0 ? '↑' : '↓'} {Math.abs(stats.maintenanceTrend)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⚠</div>
          <div className="stat-content">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{stats.lowStockItems}</div>
            <div className="stat-detail">
              {stats.outOfStockItems} out of stock
            </div>
            {stats.inventoryTrend !== undefined && stats.inventoryTrend !== 0 && (
              <div className={`stat-trend ${stats.inventoryTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                {stats.inventoryTrend > 0 ? '↑' : '↓'} {Math.abs(stats.inventoryTrend)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Requisitions</div>
            <div className="stat-value">{stats.pendingRequisitions}</div>
            <div className="stat-detail">pending approval</div>
            {stats.requisitionsTrend !== undefined && stats.requisitionsTrend !== 0 && (
              <div className={`stat-trend ${stats.requisitionsTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                {stats.requisitionsTrend > 0 ? '↑' : '↓'} {Math.abs(stats.requisitionsTrend)}%
              </div>
            )}
          </div>
        </div>

        {/* Admin/Manager only stats */}
        {(user?.role === 'administrator' || user?.role === 'manager') && (
          <>
            <div className="stat-card stat-card-purple">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-detail">{stats.activeUsers} active</div>
              </div>
            </div>
            
            <div className="stat-card stat-card-teal">
              <div className="stat-icon">📍</div>
              <div className="stat-content">
                <div className="stat-label">Total Sites</div>
                <div className="stat-value">{stats.totalSites || 0}</div>
                <div className="stat-detail">across all locations</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      {chartData.machineStatus && (
        <div className="charts-grid">
          <div className="chart-wrapper">
            <Charts 
              data={chartData.machineStatus} 
              type="pie" 
              title="Machine Status Distribution" 
            />
          </div>
          <div className="chart-wrapper">
            <Charts 
              data={chartData.maintenanceStatus} 
              type="bar" 
              title="Maintenance Tasks" 
            />
          </div>
          <div className="chart-wrapper">
            <Charts 
              data={chartData.inventoryStatus} 
              type="pie" 
              title="Inventory Status" 
            />
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {(stats.underMaintenance > 0 || stats.lowStockItems > 0 || stats.pendingRequisitions > 0) && (
        <div className="alerts-section">
          {stats.underMaintenance > 0 && (
            <div className="alert alert-warning">
              <strong>⚠ {stats.underMaintenance}</strong> machine(s) currently under maintenance
            </div>
          )}
          {stats.outOfStockItems > 0 && (
            <div className="alert alert-danger">
              <strong>🚨 {stats.outOfStockItems}</strong> inventory item(s) are out of stock
            </div>
          )}
          {stats.pendingRequisitions > 0 && (
            <div className="alert alert-info">
              <strong>📋 {stats.pendingRequisitions}</strong> requisition(s) awaiting approval
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Machine Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Machine Status Overview</h3>
          </div>
          <div className="card-body">
            <div className="status-breakdown">
              {Object.keys(machineStatusBreakdown).length > 0 ? (
                Object.entries(machineStatusBreakdown).map(([status, count]) => (
                  <div key={status} className="status-item">
                    <div className="status-info">
                      <span className="status-label">{status.replace('-', ' ').toUpperCase()}</span>
                      <span className="status-count">{count}</span>
                    </div>
                    <div className="status-bar">
                      <div 
                        className={`status-bar-fill status-${status}`}
                        style={{ width: `${getStatusPercentage(status)}%` }}
                      ></div>
                    </div>
                    <span className="status-percentage">{getStatusPercentage(status)}%</span>
                  </div>
                ))
              ) : (
                <p className="text-muted">No machine data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Maintenance Activities</h3>
            <Link to="/maintenance" className="btn btn-sm btn-outline-primary">
              View All
            </Link>
          </div>
          <div className="card-body">
            {recentActivities.length > 0 ? (
              <div className="activity-list">
                {recentActivities.map((activity) => (
                  <div key={activity._id} className="activity-item">
                    <div className="activity-icon">
                      {activity.status === 'completed' ? '✓' : 
                       activity.status === 'in-progress' ? '⚙' : '⏱'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        <span className={getStatusBadgeClass(activity.status)}>
                          {activity.status?.toUpperCase()}
                        </span>
                        {activity.priority && (
                          <span className={getPriorityBadgeClass(activity.priority)}>
                            {activity.priority?.toUpperCase()}
                          </span>
                        )}
                        <span className="activity-date">
                          {formatDate(activity.scheduledDate || activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No recent activities</p>
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="card">
          <div className="card-header">
            <h3>Upcoming Maintenance</h3>
            <span className="badge badge-info">Next 7 Days</span>
          </div>
          <div className="card-body">
            {upcomingMaintenance.length > 0 ? (
              <div className="upcoming-list">
                {upcomingMaintenance.map((item) => (
                  <div key={item._id} className="upcoming-item">
                    <div className="upcoming-date">
                      <div className="date-day">
                        {new Date(item.scheduledDate).getDate()}
                      </div>
                      <div className="date-month">
                        {new Date(item.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className="upcoming-details">
                      <div className="upcoming-title">{item.title}</div>
                      <div className="upcoming-machine">
                        {item.machineId?.name || 'N/A'}
                      </div>
                      {item.priority && (
                        <span className={getPriorityBadgeClass(item.priority)}>
                          {item.priority?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No upcoming maintenance scheduled</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3>Low Stock Alert</h3>
            <Link to="/inventory" className="btn btn-sm btn-outline-warning">
              View Inventory
            </Link>
          </div>
          <div className="card-body">
            {lowStockItems.length > 0 ? (
              <div className="low-stock-list">
                {lowStockItems.map((item) => (
                  <div key={item._id} className="low-stock-item">
                    <div className="low-stock-info">
                      <div className="low-stock-name">{item.name}</div>
                      <div className="low-stock-category">{item.category || 'Uncategorized'}</div>
                    </div>
                    <div className="low-stock-quantity">
                      <span className={item.currentStock === 0 ? 'badge badge-danger' : 'badge badge-warning'}>
                        {item.currentStock} {item.unit}
                      </span>
                      <small className="text-muted">Min: {item.minStock}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <p>All inventory items are adequately stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <Link to="/machines" className="quick-action-card">
            <div className="quick-action-icon">➕</div>
            <div className="quick-action-text">Add Machine</div>
          </Link>
          <Link to="/maintenance" className="quick-action-card">
            <div className="quick-action-icon">🔧</div>
            <div className="quick-action-text">Schedule Maintenance</div>
          </Link>
          <Link to="/inventory" className="quick-action-card">
            <div className="quick-action-icon">📦</div>
            <div className="quick-action-text">Add Inventory</div>
          </Link>
          <Link to="/requisitions" className="quick-action-card">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-text">New Requisition</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
