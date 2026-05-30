import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiArrowLeft, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import '../styles/knowledge-gaps.css';

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

  if (userType !== 'company') {
    return null;
  }

  return (
    <div className="knowledge-gaps-container">
      <div className="knowledge-gaps-header">
        <motion.button
          className="knowledge-gaps-back-button"
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Chat
        </motion.button>

        <h1 className="knowledge-gaps-header-title">Knowledge Gaps</h1>

        {gaps.length > 0 && (
          <motion.button
            className="knowledge-gaps-clear-button"
            onClick={handleClearGaps}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTrash2 size={18} />
            Clear All
          </motion.button>
        )}
      </div>

      {statistics && (
        <motion.div
          className="knowledge-gaps-stats-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div className="knowledge-gaps-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="knowledge-gaps-stat-number">
              {statistics.total_queries}
            </div>
            <div className="knowledge-gaps-stat-label">Total Queries</div>
          </motion.div>

          <motion.div className="knowledge-gaps-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="knowledge-gaps-stat-number">
              {statistics.low_confidence_count}
            </div>
            <div className="knowledge-gaps-stat-label">Knowledge Gaps</div>
          </motion.div>

          <motion.div className="knowledge-gaps-stat-card" whileHover={{ scale: 1.05 }}>
            <div className="knowledge-gaps-stat-number">
              {statistics.avg_confidence ? `${(statistics.avg_confidence * 100).toFixed(0)}%` : 'N/A'}
            </div>
            <div className="knowledge-gaps-stat-label">Avg Confidence</div>
          </motion.div>
        </motion.div>
      )}

      <div className="knowledge-gaps-filter-container">
        {['all', 'critical', 'medium', 'low'].map((level) => (
          <motion.button
            key={level}
            className={`knowledge-gaps-filter-button ${filterLevel === level ? 'active' : ''}`}
            onClick={() => setFilterLevel(level)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </motion.button>
        ))}
      </div>

      <motion.div
        className="knowledge-gaps-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="knowledge-gaps-content-header">
          <h2 className="knowledge-gaps-content-title">
            <FiAlertCircle style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Questions your documents couldn't answer well
          </h2>
          <p className="knowledge-gaps-content-subtitle">
            {filteredGaps.length} gap{filteredGaps.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {loading ? (
          <div className="knowledge-gaps-loading-container">
            <div className="knowledge-gaps-dots-container">
              <motion.div
                className="knowledge-gaps-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="knowledge-gaps-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.div
                className="knowledge-gaps-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
            </div>
          </div>
        ) : filteredGaps.length === 0 ? (
          <div className="knowledge-gaps-empty-state">
            <div className="knowledge-gaps-empty-icon">✅</div>
            <div className="knowledge-gaps-empty-text">
              {filterLevel === 'all' 
                ? 'Your documents are covering all questions well.'
                : `No ${filterLevel} priority gaps found.`}
            </div>
          </div>
        ) : (
          <div className="knowledge-gaps-list">
            <AnimatePresence>
              {filteredGaps.map((gap, index) => (
                <motion.div
                  key={index}
                  className="knowledge-gaps-item"
                  style={{ borderLeftColor: getConfidenceColor(gap.confidence) }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="knowledge-gaps-item-header">
                    <p className="knowledge-gaps-item-question">{gap.query}</p>
                    <span
                      className={`knowledge-gaps-confidence-badge knowledge-gaps-confidence-${getSeverityLevel(gap.confidence)}`}
                    >
                      {getConfidenceLabel(gap.confidence)}
                    </span>
                  </div>

                  <div className="knowledge-gaps-item-meta">
                    <div className="knowledge-gaps-meta-item">
                      <span>Confidence: {(gap.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="knowledge-gaps-meta-item">
                      <span>•</span>
                      <span>Count: {gap.count}</span>
                    </div>
                    <div className="knowledge-gaps-meta-item">
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
