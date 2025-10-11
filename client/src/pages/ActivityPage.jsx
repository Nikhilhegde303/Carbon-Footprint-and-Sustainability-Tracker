import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ActivityPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    factorId: '',
    consumption: '',
    date: new Date().toISOString().split('T')[0]
  });

  const activityOptions = [
    { id: 1, name: 'Car Travel (per km)', unit: 'km' },
    { id: 2, name: 'Bus Travel (per km)', unit: 'km' },
    { id: 3, name: 'Electricity Usage (per kWh)', unit: 'kWh' },
    { id: 4, name: 'Beef Consumption (per kg)', unit: 'kg' },
    { id: 5, name: 'Vegetables (per kg)', unit: 'kg' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.factorId || !formData.consumption) {
      alert('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Activity added successfully!');
        setFormData({
          factorId: '',
          consumption: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity');
    }
  };

  const handleViewActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/activities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data);
        setShowForm(false);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('Failed to fetch activities');
    }
  };

  const handleAddNew = () => {
    setShowForm(true);
    setActivities([]);
  };

  const getActivityName = (factorId) => {
    const activity = activityOptions.find(a => a.id === factorId);
    return activity ? activity.name : 'Unknown Activity';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Activity Management</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={handleAddNew}
          style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}
        >
          Add New Activity
        </button>
        <button 
          onClick={handleViewActivities}
          style={{ padding: '0.5rem 1rem' }}
        >
          View My Activities
        </button>
      </div>

      {showForm ? (
        <div style={{ border: '1px solid #ccc', padding: '2rem', borderRadius: '8px' }}>
          <h2>Add New Activity</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Activity Type: </label>
              <select 
                value={formData.factorId} 
                onChange={(e) => setFormData({...formData, factorId: e.target.value})}
                style={{ padding: '0.5rem', marginLeft: '1rem', width: '300px' }}
                required
              >
                <option value="">Select Activity</option>
                {activityOptions.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Consumption Value: </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.consumption} 
                onChange={(e) => setFormData({...formData, consumption: e.target.value})}
                style={{ padding: '0.5rem', marginLeft: '1rem' }}
                placeholder="e.g., 100"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Date: </label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={{ padding: '0.5rem', marginLeft: '1rem' }}
                required
              />
            </div>

            <button type="submit" style={{ padding: '0.5rem 2rem' }}>
              Save Activity
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>My Activities</h2>
          {activities.length === 0 ? (
            <p>No activities found</p>
          ) : (
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem' }}>Activity Type</th>
                  <th style={{ padding: '0.5rem' }}>Consumption</th>
                  <th style={{ padding: '0.5rem' }}>Emission</th>
                  <th style={{ padding: '0.5rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.activity_id}>
                    <td style={{ padding: '0.5rem' }}>{getActivityName(activity.factor_id)}</td>
                    <td style={{ padding: '0.5rem' }}>{activity.consumption_value}</td>
                    <td style={{ padding: '0.5rem' }}>{activity.calculated_emission} kg CO2</td>
                    <td style={{ padding: '0.5rem' }}>{new Date(activity.activity_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityPage;