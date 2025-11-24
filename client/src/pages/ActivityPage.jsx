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
  const [lastFeedback, setLastFeedback] = useState(null);

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
    if ((name === 'factor_id' || name === 'consumption_value') && (name === 'factor_id' ? formData.consumption_value : formData.factor_id)) {
      calculateEmission(name === 'factor_id' ? value : formData.factor_id, name === 'consumption_value' ? value : formData.consumption_value);
    }
  };

  const calculateEmission = (factorId = formData.factor_id, consumption = formData.consumption_value) => {
    if (!consumption || !factorId) return;

    const factor = emissionFactors.find(f => f.factor_id == factorId);
    if (factor) {
      const emission = Number(consumption) * Number(factor.emission_factor);
      setCalculation({
        emission: emission.toFixed(4),
        unit: factor.unit,
        activity_name: factor.activity_name,
        category: factor.category
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

      // Show eco feedback instead of points
      setLastFeedback(result.feedback || null);

      alert(
        [
          `✅ ${result.message}`,
          `• Activity: ${result.activityName}`,
          `• Emission: ${result.calculatedEmission} ${result.unit}`,
          result?.feedback?.summary ? `• Feedback: ${result.feedback.summary}` : ''
        ].filter(Boolean).join('\n')
      );

      // Reset form
      setFormData({
        factor_id: emissionFactors[0]?.factor_id || '',
        consumption_value: '',
        activity_date: new Date().toISOString().split('T')[0]
      });
      setCalculation(null);

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
    if (!showActivities) fetchActivities();
    setShowActivities(!showActivities);
  };

  return (
    <div className="activity-page">
      <div className="activity-container">
        <h1>Log New Activity</h1>
        <p>Track your emissions. Points are awarded weekly based on reduction.</p>

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
                <h3>Emission Preview</h3>
                <div className="calculation-details">
                  <div className="calculation-item">
                    <span>Carbon Emission:</span>
                    <strong>{calculation.emission} {calculation.unit}</strong>
                  </div>
                  <div className="calculation-item">
                    <span>Activity:</span>
                    <strong>{calculation.activity_name}</strong>
                  </div>
                </div>
                <small>Note: Weekly points are awarded when your 7-day total is lower than the previous 7 days.</small>
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

        {/* Optional inline feedback */}
        {lastFeedback && (
          <div className={`eco-feedback eco-${lastFeedback.level}`}>
            <div className="eco-feedback-header">{lastFeedback.summary}</div>
            <ul className="eco-feedback-tips">
              {lastFeedback.suggestions?.map((t, i) => <li key={i}>• {t}</li>)}
            </ul>
          </div>
        )}

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
                        <span>Points:</span>
                        <strong className="points">Awarded weekly</strong>
                      </div>
                    </div>
                    <div className="activity-category">
                      <span className={`category-badge ${String(activity.category || '').toLowerCase()}`}>
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
