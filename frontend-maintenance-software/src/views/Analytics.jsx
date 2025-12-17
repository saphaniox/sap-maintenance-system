import React, { useState, useEffect } from 'react';
import AnalyticsService from '../services/analytics.service';
import siteService from '../services/site.service';
import { BarChart, LineChart, PieChart, StatCard } from '../components/Charts';
import { useToast } from '../contexts/ToastContext';
import '../styles/pages/Analytics.css';

function Analytics() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sites, setSites] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    siteId: '',
    startDate: '',
    endDate: ''
  });

  // Analytics Data
  const [productionData, setProductionData] = useState(null);
  const [siteComparison, setSiteComparison] = useState(null);
  const [machinePerformance, setMachinePerformance] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [efficiencyTrends, setEfficiencyTrends] = useState(null);

  useEffect(() => {
    fetchSites();
    fetchAllAnalytics();
  }, [filters]);

  const fetchSites = async () => {
    try {
      const sitesData = await siteService.getAllSites();
      setSites(sitesData);
    } catch (error) {
      showToast('Error fetching sites', 'error');
    }
  };

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      
      const [production, comparison, machines, maintenance, efficiency] = await Promise.all([
        AnalyticsService.getProductionAnalytics(filters),
        AnalyticsService.getSiteComparison(filters),
        AnalyticsService.getMachinePerformance(filters),
        AnalyticsService.getMaintenanceAnalytics(filters),
        AnalyticsService.getEfficiencyTrends(filters)
      ]);

      setProductionData(production);
      setSiteComparison(comparison);
      setMachinePerformance(machines);
      setMaintenanceData(maintenance);
      setEfficiencyTrends(efficiency);
    } catch (error) {
      showToast('Error fetching analytics: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ siteId: '', startDate: '', endDate: '' });
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics-container">
      <div className="page-header">
        <h1>📊 Production Analytics</h1>
      </div>

      {/* Filters Section */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Site</label>
          <select 
            value={filters.siteId} 
            onChange={(e) => handleFilterChange('siteId', e.target.value)}
            className="filter-select"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site._id} value={site._id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input 
            type="date" 
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input 
            type="date" 
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="filter-input"
          />
        </div>

        <button onClick={clearFilters} className="btn-secondary">
          Clear Filters
        </button>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'sites' ? 'active' : ''}`}
          onClick={() => setActiveTab('sites')}
        >
          Site Comparison
        </button>
        <button 
          className={`tab ${activeTab === 'machines' ? 'active' : ''}`}
          onClick={() => setActiveTab('machines')}
        >
          Machine Performance
        </button>
        <button 
          className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && productionData && (
          <>
            {/* KPI Cards */}
            <div className="stats-grid">
              <StatCard
                title="Total Reports"
                value={productionData.overview?.totalReports || 0}
                icon="📋"
                color="#3b82f6"
              />
              <StatCard
                title="Total Production"
                value={`${(productionData.overview?.totalOutput || 0).toLocaleString()} Kg`}
                subtitle="Total Output"
                icon="🏭"
                color="#10b981"
              />
              <StatCard
                title="Average Efficiency"
                value={`${productionData.overview?.averageEfficiency || 0}%`}
                subtitle="Output/Input Ratio"
                icon="⚡"
                color="#f59e0b"
              />
              <StatCard
                title="Total Downtime"
                value={`${((productionData.overview?.totalDowntime || 0) / 60).toFixed(1)} hrs`}
                subtitle="Machine Downtime"
                icon="⏱️"
                color="#ef4444"
              />
            </div>

            {/* Production Trends */}
            {productionData.productionTrends && productionData.productionTrends.length > 0 && (
              <div className="chart-row">
                <LineChart
                  data={productionData.productionTrends}
                  xKey="week"
                  yKeys={['output', 'input']}
                  title="Production Trends (Last 12 Weeks)"
                  colors={['#10b981', '#3b82f6']}
                  height={350}
                />
              </div>
            )}

            {/* Efficiency Trends */}
            {efficiencyTrends?.efficiencyTrends && efficiencyTrends.efficiencyTrends.length > 0 && (
              <div className="chart-row">
                <LineChart
                  data={efficiencyTrends.efficiencyTrends}
                  xKey="week"
                  yKeys={['efficiency']}
                  title="Efficiency Trends Over Time"
                  colors={['#f59e0b']}
                  height={350}
                />
              </div>
            )}
          </>
        )}

        {/* Site Comparison Tab */}
        {activeTab === 'sites' && siteComparison && (
          <>
            {/* Top Performer Card */}
            {siteComparison.topPerformer && (
              <div className="top-performer-banner">
                <div className="trophy-icon">🏆</div>
                <div className="performer-info">
                  <h2>Top Performing Site</h2>
                  <h3>{siteComparison.topPerformer.siteName}</h3>
                  <p>
                    Total Production: <strong>{siteComparison.topPerformer.totalOutput.toLocaleString()} Kg</strong>
                    {' | '}
                    Efficiency: <strong>{siteComparison.topPerformer.averageEfficiency}%</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Site Production Comparison */}
            {siteComparison.siteComparison && siteComparison.siteComparison.length > 0 && (
              <>
                <div className="chart-row">
                  <BarChart
                    data={siteComparison.siteComparison}
                    xKey="siteName"
                    yKey="totalOutput"
                    title="Total Production by Site (Kg)"
                    color="#10b981"
                    height={350}
                  />
                </div>

                <div className="chart-row">
                  <BarChart
                    data={siteComparison.siteComparison}
                    xKey="siteName"
                    yKey="averageEfficiency"
                    title="Average Efficiency by Site (%)"
                    color="#3b82f6"
                    height={350}
                  />
                </div>

                {/* Site Comparison Table */}
                <div className="table-container">
                  <h3>Site Performance Details</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Site</th>
                        <th>Code</th>
                        <th>Total Output (Kg)</th>
                        <th>Efficiency (%)</th>
                        <th>Machines</th>
                        <th>Output/Machine</th>
                        <th>Downtime (hrs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteComparison.siteComparison.map((site, index) => (
                        <tr key={index}>
                          <td className="rank">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </td>
                          <td className="site-name">{site.siteName}</td>
                          <td>{site.siteCode}</td>
                          <td className="number">{site.totalOutput.toLocaleString()}</td>
                          <td className="number">
                            <span className={`efficiency-badge ${parseFloat(site.averageEfficiency) >= 80 ? 'high' : parseFloat(site.averageEfficiency) >= 60 ? 'medium' : 'low'}`}>
                              {site.averageEfficiency}%
                            </span>
                          </td>
                          <td className="number">{site.machinesCount}</td>
                          <td className="number">{parseFloat(site.outputPerMachine).toLocaleString()}</td>
                          <td className="number">{site.downtimeHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* Machine Performance Tab */}
        {activeTab === 'machines' && machinePerformance && (
          <>
            {machinePerformance.topMachine && (
              <div className="top-performer-banner machine">
                <div className="trophy-icon">⚙️</div>
                <div className="performer-info">
                  <h2>Top Performing Machine</h2>
                  <h3>{machinePerformance.topMachine.machineName}</h3>
                  <p>
                    Production: <strong>{machinePerformance.topMachine.totalOutput.toLocaleString()} Kg</strong>
                    {' | '}
                    Efficiency: <strong>{machinePerformance.topMachine.averageEfficiency}%</strong>
                  </p>
                </div>
              </div>
            )}

            {machinePerformance.machinePerformance && machinePerformance.machinePerformance.length > 0 && (
              <>
                <div className="chart-row">
                  <BarChart
                    data={machinePerformance.machinePerformance.slice(0, 10)}
                    xKey="machineName"
                    yKey="totalOutput"
                    title="Top 10 Machines by Production (Kg)"
                    color="#8b5cf6"
                    height={350}
                  />
                </div>

                <div className="table-container">
                  <h3>Machine Performance Details</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Machine</th>
                        <th>Type</th>
                        <th>Site</th>
                        <th>Total Output (Kg)</th>
                        <th>Efficiency (%)</th>
                        <th>Downtime (hrs)</th>
                        <th>Reports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machinePerformance.machinePerformance.map((machine, index) => (
                        <tr key={index}>
                          <td className="rank">{index + 1}</td>
                          <td>{machine.machineName}</td>
                          <td>{machine.machineType}</td>
                          <td>{machine.siteName}</td>
                          <td className="number">{machine.totalOutput.toLocaleString()}</td>
                          <td className="number">
                            <span className={`efficiency-badge ${parseFloat(machine.averageEfficiency) >= 80 ? 'high' : parseFloat(machine.averageEfficiency) >= 60 ? 'medium' : 'low'}`}>
                              {machine.averageEfficiency}%
                            </span>
                          </td>
                          <td className="number">{machine.downtimeHours}</td>
                          <td className="number">{machine.reportsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && maintenanceData && (
          <>
            <div className="stats-grid">
              <StatCard
                title="Total Maintenance"
                value={maintenanceData.overview?.totalMaintenance || 0}
                icon="🔧"
                color="#3b82f6"
              />
              <StatCard
                title="Completed"
                value={maintenanceData.overview?.completedMaintenance || 0}
                subtitle={`${maintenanceData.overview?.completionRate || 0}% completion rate`}
                icon="✅"
                color="#10b981"
              />
              <StatCard
                title="Pending"
                value={maintenanceData.overview?.pendingMaintenance || 0}
                icon="⏳"
                color="#f59e0b"
              />
              <StatCard
                title="Total Cost"
                value={`UGX ${(maintenanceData.overview?.totalCost || 0).toLocaleString()}`}
                icon="💰"
                color="#ef4444"
              />
            </div>

            {maintenanceData.maintenanceByType && (
              <div className="chart-row-split">
                <PieChart
                  data={[
                    { type: 'Preventive', count: maintenanceData.maintenanceByType.preventive },
                    { type: 'Corrective', count: maintenanceData.maintenanceByType.corrective },
                    { type: 'Predictive', count: maintenanceData.maintenanceByType.predictive }
                  ].filter(item => item.count > 0)}
                  labelKey="type"
                  valueKey="count"
                  title="Maintenance by Type"
                  colors={['#3b82f6', '#f59e0b', '#10b981']}
                />
              </div>
            )}

            {maintenanceData.maintenanceBySite && maintenanceData.maintenanceBySite.length > 0 && (
              <div className="table-container">
                <h3>Maintenance by Site</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Code</th>
                      <th>Total Maintenance</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                      <th>Total Cost (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceData.maintenanceBySite.map((site, index) => (
                      <tr key={index}>
                        <td>{site.siteName}</td>
                        <td>{site.siteCode}</td>
                        <td className="number">{site.count}</td>
                        <td className="number">{site.completed}</td>
                        <td className="number">
                          {site.count > 0 ? ((site.completed / site.count) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="number">{site.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
