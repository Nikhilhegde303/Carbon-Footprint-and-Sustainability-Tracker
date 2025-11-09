import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getUserPoints, getRedemptionHistory } from '../utils/api.js';
import './RewardsPage.css';

const RewardsPage = () => {
  const [tab, setTab] = useState('available'); // "available" or "history"
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadData = async () => {
      try {
        setUserPoints(await getUserPoints());

        const res = await axios.get('/api/rewards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setRewards(res.data.data);

        const hist = await getRedemptionHistory();
        setHistory(hist);

      } catch (err) {
        console.error('Error loading rewards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleRedeem = async (reward) => {
    if (userPoints < reward.points_required) {
      alert('Not enough points');
      return;
    }

    try {
      const res = await axios.post(
        '/api/rewards/redeem',
        { reward_id: reward.reward_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('🎉 Successfully redeemed!');
        setUserPoints(p => p - reward.points_required);
        setRewards(prev =>
          prev.map(r => r.reward_id === reward.reward_id
            ? { ...r, stock_count: r.stock_count - 1 }
            : r
          )
        );

        // Refresh history
        setHistory(await getRedemptionHistory());
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Redeem failed');
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;

  return (
    <div className="rewards-page container mx-auto px-6 py-10">

      <div className="page-header">
        <h2 className="text-3xl font-bold text-green-700 flex items-center gap-2">🎁 Rewards</h2>
        <div className="points-badge">⭐ Your Points: {userPoints}</div>
      </div>

      {/* ✅ Tab buttons */}
      <div className="tab-buttons">
        <button className={tab === 'available' ? 'active-tab' : ''} onClick={() => setTab('available')}>
          Available Rewards
        </button>
        <button className={tab === 'history' ? 'active-tab' : ''} onClick={() => setTab('history')}>
          My Redeemed Rewards
        </button>
      </div>

      {/* ✅ Available Rewards */}
      {tab === 'available' && (
        <div className="rewards-grid">
          {rewards.map(reward => (
            <div key={reward.reward_id} className="reward-card">
              <h3 className="text-xl font-semibold">{reward.name}</h3>
              <p className="text-gray-600 text-sm">{reward.description}</p>

              <div className="reward-meta">
                <span className="points-cost">⭐ {reward.points_required} pts</span>
                <span className="stock">{reward.stock_count} left</span>
              </div>

              <button
                className={`btn ${userPoints >= reward.points_required && reward.stock_count > 0 ? "btn-success" : "btn-disabled"}`}
                disabled={userPoints < reward.points_required || reward.stock_count <= 0}
                onClick={() => handleRedeem(reward)}
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Redeemed Rewards History */}
      {tab === 'history' && (
        <div className="history-table">
          {history.length === 0 ? (
            <p className="no-data">You haven't redeemed any rewards yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Points Spent</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.redemption_id}>
                    <td>{item.name}</td>
                    <td className="points-spent">-{item.points_spent}</td>
                    <td>{new Date(item.redumption_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
};

export default RewardsPage;
