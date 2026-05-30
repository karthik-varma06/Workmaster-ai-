import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiArrowLeft, 
  FiTrash2, 
  FiTrendingUp,
  FiTarget,
  FiAward
} from 'react-icons/fi';
import '../styles/analytics.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function StudentAnalytics({ userType }) {
  const [weakTopics, setWeakTopics] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userType !== 'student') {
      navigate('/chat');
      return;
    }
    fetchAnalytics();
  }, [userType, navigate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/student-analytics`);
      setWeakTopics(response.data.weak_topics);
      setStatistics(response.data.statistics);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAnalytics = async () => {
    if (!window.confirm('Clear all study analytics? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/student-analytics`);
      fetchAnalytics();
      alert('Analytics cleared successfully!');
    } catch (error) {
      console.error('Failed to clear analytics:', error);
      alert('Failed to clear analytics');
    }
  };

  const getWeaknessColor = (score) => {
    if (score > 0.7) return '#ef4444';
    if (score > 0.5) return '#f59e0b';
    return '#10b981';
  };

  const getWeaknessLabel = (score) => {
    if (score > 0.7) return 'Needs Focus';
    if (score > 0.5) return 'Review Needed';
    return 'Good Progress';
  };



  if (userType !== 'student') {
    return null;
  }

  return (
    <div className="analytics-container">
      {/* Styles now in analytics.css */}

      <div className="analytics-header">
        <motion.button
          className="analytics-back-button"
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Chat
        </motion.button>

        <h1 className="analytics-header-title">📚 My Study Analytics</h1>

        <div className="analytics-action-buttons">
          <motion.button
            className="analytics-quiz-button"
            onClick={() => navigate('/practice-quiz')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTarget size={18} />
            Practice Quiz
          </motion.button>

          {weakTopics.length > 0 && (
            <motion.button
              className="analytics-clear-button"
              onClick={handleClearAnalytics}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={18} />
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {statistics && (
        <motion.div
          className="analytics-stats-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div className="analytics-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="analytics-stat-icon">📝</div>
            <div className="analytics-stat-number analytics-stat-number-primary">
              {statistics.total_queries}
            </div>
            <div className="analytics-stat-label">Questions Asked</div>
          </motion.div>

          <motion.div className="analytics-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="analytics-stat-icon">📚</div>
            <div className="analytics-stat-number analytics-stat-number-purple">
              {statistics.topics_studied}
            </div>
            <div className="analytics-stat-label">Topics Studied</div>
          </motion.div>

          <motion.div className="analytics-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="analytics-stat-icon">⚠️</div>
            <div className="analytics-stat-number analytics-stat-number-warning">
              {statistics.weak_topics_count}
            </div>
            <div className="analytics-stat-label">Topics to Review</div>
          </motion.div>

          <motion.div className="analytics-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="analytics-stat-icon">📊</div>
            <div className="analytics-stat-number analytics-stat-number-primary">
              {(statistics.avg_confidence * 100).toFixed(0)}%
            </div>
            <div className="analytics-stat-label">Avg Understanding</div>
          </motion.div>
        </motion.div>
      )}

      {loading ? (
        <div className="analytics-loading-container">
          <div className="analytics-dots-container">
            <motion.div
              className="analytics-dot"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.div
              className="analytics-dot"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="analytics-dot"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      ) : (
        <div className="analytics-content">
          <div className="analytics-main-content">
            <h2 className="analytics-section-title">
              <FiTrendingUp />
              Topics Needing Review
            </h2>

            {weakTopics.length === 0 ? (
              <div className="analytics-empty-state">
                <div className="analytics-empty-icon">🎉</div>
                <div className="analytics-empty-text">
                  Great job! No weak topics found. Keep studying!
                </div>
              </div>
            ) : (
              <div className="analytics-topics-list">
                <AnimatePresence>
                  {weakTopics.map((topic, index) => (
                    <motion.div
                      key={index}
                      className="analytics-topic-item"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: getWeaknessColor(topic.weakness_score),
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="analytics-topic-header">
                        <div className="analytics-topic-name">{topic.topic}</div>
                        <span
                          className="analytics-weakness-badge"
                          style={{
                            background: getWeaknessColor(topic.weakness_score) + '20',
                            color: getWeaknessColor(topic.weakness_score),
                          }}
                        >
                          {getWeaknessLabel(topic.weakness_score)}
                        </span>
                      </div>

                      <div className="analytics-topic-meta">
                        <span>📝 {topic.query_count} questions</span>
                        <span>•</span>
                        <span>📊 {(topic.avg_confidence * 100).toFixed(0)}% confidence</span>
                        <span>•</span>
                        <span>⚠️ {topic.low_confidence_count} weak answers</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="analytics-sidebar">
            <h2 className="analytics-section-title">
              <FiAward />
              Recommendations
            </h2>

            <div className="analytics-recommendations-list">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  className="analytics-recommendation-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  {rec}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentAnalytics;
