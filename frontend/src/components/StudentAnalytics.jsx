import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiArrowLeft, 
  FiTrash2, 
  FiBarChart2, 
  FiTrendingUp,
  FiBook,
  FiTarget,
  FiAward
} from 'react-icons/fi';

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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto 30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px',
    },
    backButton: {
      padding: '12px 24px',
      background: 'rgba(255, 255, 255, 0.95)',
      border: 'none',
      borderRadius: '12px',
      color: '#667eea',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    headerTitle: {
      flex: 1,
      color: 'white',
      margin: 0,
      fontSize: '32px',
      fontWeight: '800',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
    },
    quizButton: {
      padding: '12px 24px',
      background: 'rgba(16, 185, 129, 0.95)',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    clearButton: {
      padding: '12px 24px',
      background: 'rgba(239, 68, 68, 0.95)',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    },
    statsContainer: {
      maxWidth: '1200px',
      margin: '0 auto 30px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '25px',
      borderRadius: '16px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    statIcon: {
      fontSize: '32px',
      marginBottom: '10px',
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: '800',
      marginBottom: '8px',
    },
    statLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '20px',
    },
    mainContent: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    sidebar: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    sectionTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#9ca3af',
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px',
    },
    emptyText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#6b7280',
    },
    topicsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    topicItem: {
      background: '#f8f9ff',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
      transition: 'all 0.3s',
    },
    topicHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
    },
    topicName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f2937',
      flex: 1,
    },
    weaknessBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    topicMeta: {
      display: 'flex',
      gap: '15px',
      fontSize: '12px',
      color: '#6b7280',
    },
    recommendationsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    recommendationItem: {
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '10px',
      padding: '14px',
      fontSize: '14px',
      color: '#0c4a6e',
      lineHeight: '1.5',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 20px',
    },
    dotsContainer: {
      display: 'flex',
      gap: '10px',
    },
    dot: {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: '#667eea',
    },
  };

  if (userType !== 'student') {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          style={styles.backButton}
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Chat
        </motion.button>

        <h1 style={styles.headerTitle}>📚 My Study Analytics</h1>

        <div style={styles.actionButtons}>
          <motion.button
            style={styles.quizButton}
            onClick={() => navigate('/practice-quiz')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTarget size={18} />
            Practice Quiz
          </motion.button>

          {weakTopics.length > 0 && (
            <motion.button
              style={styles.clearButton}
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
          style={styles.statsContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={styles.statIcon}>📝</div>
            <div style={{ ...styles.statNumber, color: '#667eea' }}>
              {statistics.total_queries}
            </div>
            <div style={styles.statLabel}>Questions Asked</div>
          </motion.div>

          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={styles.statIcon}>📚</div>
            <div style={{ ...styles.statNumber, color: '#8b5cf6' }}>
              {statistics.topics_studied}
            </div>
            <div style={styles.statLabel}>Topics Studied</div>
          </motion.div>

          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={styles.statIcon}>⚠️</div>
            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>
              {statistics.weak_topics_count}
            </div>
            <div style={styles.statLabel}>Topics to Review</div>
          </motion.div>

          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={styles.statIcon}>📊</div>
            <div style={{ ...styles.statNumber, color: '#10b981' }}>
              {(statistics.avg_confidence * 100).toFixed(0)}%
            </div>
            <div style={styles.statLabel}>Avg Understanding</div>
          </motion.div>
        </motion.div>
      )}

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.dotsContainer}>
            <motion.div
              style={styles.dot}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.div
              style={styles.dot}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              style={styles.dot}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.mainContent}>
            <h2 style={styles.sectionTitle}>
              <FiTrendingUp />
              Topics Needing Review
            </h2>

            {weakTopics.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🎉</div>
                <div style={styles.emptyText}>
                  Great job! No weak topics found. Keep studying!
                </div>
              </div>
            ) : (
              <div style={styles.topicsList}>
                <AnimatePresence>
                  {weakTopics.map((topic, index) => (
                    <motion.div
                      key={index}
                      style={{
                        ...styles.topicItem,
                        borderLeftWidth: '4px',
                        borderLeftColor: getWeaknessColor(topic.weakness_score),
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div style={styles.topicHeader}>
                        <div style={styles.topicName}>{topic.topic}</div>
                        <span
                          style={{
                            ...styles.weaknessBadge,
                            background: getWeaknessColor(topic.weakness_score) + '20',
                            color: getWeaknessColor(topic.weakness_score),
                          }}
                        >
                          {getWeaknessLabel(topic.weakness_score)}
                        </span>
                      </div>

                      <div style={styles.topicMeta}>
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

          <div style={styles.sidebar}>
            <h2 style={styles.sectionTitle}>
              <FiAward />
              Recommendations
            </h2>

            <div style={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  style={styles.recommendationItem}
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
