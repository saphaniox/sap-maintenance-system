import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Requisitions() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ items: [], department: '', neededBy: '' });

  useEffect(() => {
    fetchReqs();
  }, []);

  const fetchReqs = async () => {
    try {
      const res = await api.get('/api/requisitions');
      setReqs(res.data);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/requisitions', form);
      setShowForm(false);
      setForm({ items: [], department: '', neededBy: '' });
      fetchReqs();
    } catch (error) {
      console.error('Error creating requisition:', error);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1>Requisitions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create Requisition</button>
      </div>

      {showForm && (
        <div className="card">
          <h3>Create Requisition</h3>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select 
                    name="department" 
                    className="form-control" 
                    value={form.department} 
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Operations">Operations</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Administration">Administration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Needed By (Optional)</label>
                  <input 
                    type="date" 
                    name="neededBy" 
                    className="form-control" 
                    value={form.neededBy} 
                    onChange={(e) => setForm({...form, neededBy: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority (Optional)</label>
              <select 
                name="priority" 
                className="form-control" 
                value={form.priority || 'medium'} 
                onChange={(e) => setForm({...form, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <button type="submit" className="btn btn-success">Submit</button>
              <button type="button" className="btn btn-secondary ml-2" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Req #</th>
                <th>Department</th>
                <th>Status</th>
                <th>Requested By</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r._id}>
                  <td>{r.requisitionNumber}</td>
                  <td>{r.department}</td>
                  <td>{r.status}</td>
                  <td>{r.requestedBy?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Requisitions;
