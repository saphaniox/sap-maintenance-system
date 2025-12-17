import React, { useState, useEffect } from 'react';
import axios from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalRecords: 0,
    underMaintenance: 0,
    lowStockItems: 0,
    pendingRequisitions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [maintenanceRes] = await Promise.all([
        axios.get('/api/maintenance'),
      ]);

      const totalRecords = maintenanceRes.data.length;
      const underMaintenance = maintenanceRes.data.filter(
        record => record.status === 'in-progress'
      ).length;

      setStats({
        totalRecords,
        underMaintenance,
        lowStockItems: 0,
        pendingRequisitions: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalRecords}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.underMaintenance}</div>
          <div className="stat-label">Under Maintenance</div>
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <h3>Recent Maintenance Activities</h3>
            </div>
            <p>Recent activities will be displayed here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;