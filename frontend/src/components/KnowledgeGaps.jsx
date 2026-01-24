import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiArrowLeft, FiTrash2, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function KnowledgeGaps({ userType }) {
  const [gaps, setGaps] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (userType !== 'company') {
      navigate('/chat');
      return;
    }
    fetchKnowledgeGaps();
  }, [userType, navigate]);

  const fetchKnowledgeGaps = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/knowledge-gaps`);
      setGaps(response.data.gaps);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch knowledge gaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearGaps = async () => {
    if (!window.confirm('Are you sure you want to clear all knowledge gaps? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/knowledge-gaps`);
      fetchKnowledgeGaps();
      alert('All knowledge gaps cleared successfully!');
    } catch (error) {
      console.error('Failed to clear gaps:', error);
      alert('Failed to clear knowledge gaps');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence < 0.3) return '#ef4444';
    if (confidence < 0.6) return '#f59e0b';
    return '#10b981';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence < 0.3) return 'Critical';
    if (confidence < 0.6) return 'Medium';
    return 'Low Priority';
  };

  const getSeverityLevel = (confidence) => {
    if (confidence < 0.3) return 'critical';
    if (confidence < 0.6) return 'medium';
    return 'low';
  };

  const filteredGaps = gaps.filter(gap => {
    if (filterLevel === 'all') return true;
    return getSeverityLevel(gap.confidence) === filterLevel;
  });

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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '25px',
      borderRadius: '16px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    statNumber: {
      fontSize: '36px',
      fontWeight: '800',
      marginBottom: '8px',
    },
    statLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    filterContainer: {
      maxWidth: '1200px',
      margin: '0 auto 20px',
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '10px 20px',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid transparent',
      borderRadius: '12px',
      color: '#4b5563',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s',
    },
    filterButtonActive: {
      background: 'rgba(255, 255, 255, 1)',
      borderColor: '#667eea',
      color: '#667eea',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    contentHeader: {
      marginBottom: '25px',
      paddingBottom: '20px',
      borderBottom: '2px solid #e5e7eb',
    },
    contentTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      margin: '0 0 8px 0',
    },
    contentSubtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
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
      fontSize: '18px',
      fontWeight: '600',
      color: '#6b7280',
    },
    gapsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    gapItem: {
      background: '#f8f9ff',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      transition: 'all 0.3s',
    },
    gapHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
      gap: '15px',
    },
    gapQuestion: {
      flex: 1,
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: '1.5',
      margin: 0,
    },
    confidenceBadge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    gapMeta: {
      display: 'flex',
      gap: '15px',
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '10px',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
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

  if (userType !== 'company') {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          style={styles.backButton}
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Chat
        </motion.button>

        <h1 style={styles.headerTitle}>Knowledge Gaps</h1>

        {gaps.length > 0 && (
          <motion.button
            style={styles.clearButton}
            onClick={handleClearGaps}
            whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTrash2 size={18} />
            Clear All
          </motion.button>
        )}
      </div>

      {statistics && (
        <motion.div
          style={styles.statsContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={{ ...styles.statNumber, color: '#667eea' }}>
              {statistics.total_queries}
            </div>
            <div style={styles.statLabel}>Total Queries</div>
          </motion.div>

          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={{ ...styles.statNumber, color: '#ef4444' }}>
              {statistics.low_confidence_count}
            </div>
            <div style={styles.statLabel}>Knowledge Gaps</div>
          </motion.div>

          <motion.div style={styles.statCard} whileHover={{ scale: 1.05 }}>
            <div style={{ ...styles.statNumber, color: '#10b981' }}>
              {statistics.avg_confidence ? `${(statistics.avg_confidence * 100).toFixed(0)}%` : 'N/A'}
            </div>
            <div style={styles.statLabel}>Avg Confidence</div>
          </motion.div>
        </motion.div>
      )}

      <div style={styles.filterContainer}>
        {['all', 'critical', 'medium', 'low'].map((level) => (
          <motion.button
            key={level}
            style={{
              ...styles.filterButton,
              ...(filterLevel === level ? styles.filterButtonActive : {}),
            }}
            onClick={() => setFilterLevel(level)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </motion.button>
        ))}
      </div>

      <motion.div
        style={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={styles.contentHeader}>
          <h2 style={styles.contentTitle}>
            <FiAlertCircle style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Questions your documents couldn't answer well
          </h2>
          <p style={styles.contentSubtitle}>
            {filteredGaps.length} gap{filteredGaps.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.dotsContainer}>
              <motion.div
                style={styles.dot}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                style={styles.dot}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.div
                style={styles.dot}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
            </div>
          </div>
        ) : filteredGaps.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✅</div>
            <div style={styles.emptyText}>
              {filterLevel === 'all' 
                ? 'Your documents are covering all questions well.'
                : `No ${filterLevel} priority gaps found.`}
            </div>
          </div>
        ) : (
          <div style={styles.gapsList}>
            <AnimatePresence>
              {filteredGaps.map((gap, index) => (
                <motion.div
                  key={index}
                  style={{
                    ...styles.gapItem,
                    borderLeftWidth: '4px',
                    borderLeftColor: getConfidenceColor(gap.confidence),
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                >
                  <div style={styles.gapHeader}>
                    <p style={styles.gapQuestion}>{gap.query}</p>
                    <span
                      style={{
                        ...styles.confidenceBadge,
                        background: getConfidenceColor(gap.confidence) + '20',
                        color: getConfidenceColor(gap.confidence),
                      }}
                    >
                      {getConfidenceLabel(gap.confidence)}
                    </span>
                  </div>

                  <div style={styles.gapMeta}>
                    <div style={styles.metaItem}>
                      <FiBarChart2 size={14} />
                      <span>Confidence: {(gap.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span>•</span>
                      <span>Count: {gap.count}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <span>•</span>
                      <span>
                        {new Date(gap.last_asked).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default KnowledgeGaps;
