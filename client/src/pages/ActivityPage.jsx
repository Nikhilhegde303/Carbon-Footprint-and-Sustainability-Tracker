import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getEmissionFactors, addActivity, getActivities } from '../utils/api.js';
import './ActivityPage.css';

const ActivityPage = () => {
  const { user } = useAuth();
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [formData, setFormData] = useState({
    factor_id: '',
    consumption_value: '',
    activity_date: new Date().toISOString().split('T')[0]
  });
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    fetchEmissionFactors();
  }, []);

  const fetchEmissionFactors = async () => {
    try {
      const factors = await getEmissionFactors();
      setEmissionFactors(factors);
      if (factors.length > 0) {
        setFormData(prev => ({ ...prev, factor_id: factors[0].factor_id }));
      }
    } catch (error) {
      console.error('Error fetching emission factors:', error);
      alert('Failed to load activity types');
    }
  };

  const fetchActivities = async () => {
    try {
      const activityData = await getActivities();
      setActivities(activityData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('Failed to load activities');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Recalculate when factor or consumption changes
    if ((name === 'factor_id' || name === 'consumption_value') && formData.consumption_value && formData.factor_id) {
      calculateEmission();
    }
  };

  const calculateEmission = () => {
    if (!formData.consumption_value || !formData.factor_id) return;

    const factor = emissionFactors.find(f => f.factor_id == formData.factor_id);
    if (factor) {
      const emission = formData.consumption_value * factor.emission_factor;
      const points = Math.round(emission * 10);
      setCalculation({
        emission: emission.toFixed(4),
        points: points,
        unit: factor.unit
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.factor_id || !formData.consumption_value || !formData.activity_date) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await addActivity(formData);
      alert(`✅ ${result.message}\n🎉 Earned ${result.pointsEarned} points!`);
      
      // Reset form
      setFormData({
        factor_id: emissionFactors[0]?.factor_id || '',
        consumption_value: '',
        activity_date: new Date().toISOString().split('T')[0]
      });
      setCalculation(null);
      
      // Refresh activities if showing
      if (showActivities) {
        fetchActivities();
      }
    } catch (error) {
      alert(error.message || 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivities = () => {
    if (!showActivities) {
      fetchActivities();
    }
    setShowActivities(!showActivities);
  };

  return (
    <div className="activity-page">
      <div className="activity-container">
        <h1>Log New Activity</h1>
        <p>Track your carbon emissions and earn points</p>

        {/* Activity Form */}
        <div className="activity-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Activity Type</label>
              <select 
                name="factor_id" 
                value={formData.factor_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select an activity</option>
                {emissionFactors.map(factor => (
                  <option key={factor.factor_id} value={factor.factor_id}>
                    {factor.activity_name} ({factor.category}) - {factor.emission_factor} {factor.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Consumption Value</label>
              <input
                type="number"
                name="consumption_value"
                value={formData.consumption_value}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="Enter consumption amount"
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="activity_date"
                value={formData.activity_date}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Calculation Preview */}
            {calculation && (
              <div className="calculation-preview">
                <h3>Emission Calculation</h3>
                <div className="calculation-details">
                  <div className="calculation-item">
                    <span>Carbon Emission:</span>
                    <strong>{calculation.emission} {calculation.unit}</strong>
                  </div>
                  <div className="calculation-item">
                    <span>Points to Earn:</span>
                    <strong className="points">{calculation.points} points</strong>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Adding Activity...' : '📝 Log Activity'}
            </button>
          </form>
        </div>

        {/* View Activities Button */}
        <div className="view-activities-section">
          <button 
            onClick={toggleActivities}
            className="toggle-activities-btn"
          >
            {showActivities ? '▲ Hide Activities' : '▼ View My Activities'}
          </button>
        </div>

        {/* Activities List */}
        {showActivities && (
          <div className="activities-list">
            <h2>My Activities</h2>
            {activities.length === 0 ? (
              <div className="no-activities">
                <p>No activities logged yet. Start by adding your first activity above!</p>
              </div>
            ) : (
              <div className="activities-grid">
                {activities.map(activity => (
                  <div key={activity.activity_id} className="activity-card">
                    <div className="activity-header">
                      <h3>{activity.activity_name}</h3>
                      <span className="activity-date">
                        {new Date(activity.activity_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="activity-details">
                      <div className="detail-item">
                        <span>Consumption:</span>
                        <strong>{activity.consumption_value} {activity.unit}</strong>
                      </div>
                      <div className="detail-item">
                        <span>Carbon Emission:</span>
                        <strong className="emission">
                          {activity.calculated_emission} kg CO₂
                        </strong>
                      </div>
                      <div className="detail-item">
                        <span>Points Earned:</span>
                        <strong className="points">+{activity.points_earned}</strong>
                      </div>
                    </div>
                    <div className="activity-category">
                      <span className={`category-badge ${activity.category.toLowerCase()}`}>
                        {activity.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;