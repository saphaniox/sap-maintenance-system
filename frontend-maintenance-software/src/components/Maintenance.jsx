import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/pages/Maintenance.css';

function Maintenance() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Fetching maintenance activities...');
      const res = await api.get('/api/maintenance');
      console.log('Maintenance response:', res);
      console.log('Maintenance data:', res.data);
      
      if (Array.isArray(res.data)) {
        setActivities(res.data);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance activities:', error);
      console.error('Error details:', error.response);
      setError(error.response?.data?.message || error.message || 'Failed to load maintenance activities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="maintenance-page">
        <div className="card">
          <div className="card-header">
            <h1>Maintenance Activities</h1>
          </div>
          <div className="card-body">
            <div style={{ padding: '40px', textAlign: 'center', color: '#1a1a1a' }}>
              <div className="spinner"></div>
              <p>Loading maintenance activities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maintenance-page">
        <div className="card">
          <div className="card-header">
            <h1>Maintenance Activities</h1>
          </div>
          <div className="card-body">
            <div className="alert alert-danger" style={{ color: '#dc3545' }}>
              <strong>Error:</strong> {error}
            </div>
            <button className="btn btn-primary" onClick={fetchActivities}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-page">
      <div className="card">
        <div className="card-header">
          <h1>Maintenance Activities</h1>
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#1a1a1a' }}>
              <p>No maintenance activities found.</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Create your first maintenance activity to get started.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act._id}>
                      <td style={{ color: '#1a1a1a', fontWeight: '600' }}>{act.title || 'N/A'}</td>
                      <td style={{ color: '#1a1a1a' }}>{act.description || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${act.status || 'pending'}`}>
                          {act.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ color: '#1a1a1a', textTransform: 'capitalize' }}>
                        {act.priority || 'medium'}
                      </td>
                      <td style={{ color: '#1a1a1a' }}>
                        {act.dueDate ? new Date(act.dueDate).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Maintenance;
