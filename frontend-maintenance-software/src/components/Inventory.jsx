import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', currentStock: 0, minStock: 0 });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/inventory');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory', form);
      setShowForm(false);
      setForm({ name: '', category: '', currentStock: 0, minStock: 0 });
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Item</button>
      </div>

      {showForm && (
        <div className="card">
          <h3>Add Inventory Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input 
                    name="name" 
                    className="form-control" 
                    value={form.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    name="category" 
                    className="form-control" 
                    value={form.category} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Lubricants">Lubricants</option>
                    <option value="Tools">Tools</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Current Stock *</label>
                  <input 
                    type="number" 
                    name="currentStock" 
                    className="form-control" 
                    value={form.currentStock} 
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Minimum Stock Level (Optional)</label>
                  <input 
                    type="number" 
                    name="minStock" 
                    className="form-control" 
                    value={form.minStock} 
                    onChange={handleChange}
                    min="0"
                  />
                  <small className="form-text text-muted">Alert threshold for low stock</small>
                </div>
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-success">Save</button>
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
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;
