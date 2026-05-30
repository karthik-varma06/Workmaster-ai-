import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function UploadPage({ userType }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const uploadResultsRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'docx', 'txt'].includes(extension);
    });
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post(
        `${API_URL}/api/upload?user_type=${userType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      setUploadReport(response.data);
      setFiles([]);
      // Auto-scroll to results
      setTimeout(() => {
        uploadResultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };



  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const fileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 },
    },
  };

  const uploadZoneVariants = {
    normal: { scale: 1 },
    hover: { scale: 1.02 },
    drag: { scale: 1.05, borderColor: '#667eea' },
  };

  return (
    <div className="upload-container">

      {/* Background Orbs */}
      <div className="upload-background-orb upload-orb-1" />
      <div className="upload-background-orb upload-orb-2" />

      <motion.div
        className="upload-content-wrapper"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="upload-header">
          <h1 className="upload-title">Upload Your Documents</h1>
          <p className="upload-subtitle">
            {userType === 'company' ? 'Employer Portal' : 'Student Portal'}
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover="hover"
          animate={dragOver ? 'drag' : 'normal'}
          variants={uploadZoneVariants}
        >
          <motion.div
            className="upload-icon"
            animate={dragOver ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {dragOver ? '📂' : '☁️'}
          </motion.div>
          <h3 className="upload-zone-title">
            {dragOver ? 'Drop your files here!' : 'Drag & Drop Files Here'}
          </h3>
          <p className="upload-zone-subtitle">or click to browse</p>
          <div>
            <span className="upload-format-badge">PDF</span>
            <span className="upload-format-badge">DOCX</span>
            <span className="upload-format-badge">TXT</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="upload-file-input"
          />
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="upload-file-list-container"
            >
              <div className="upload-file-list-header">
                📁 Selected Files ({files.length})
              </div>
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    variants={fileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="upload-file-item"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div className="upload-file-info">
                      <span className="upload-file-icon">
                        {file.name.endsWith('.pdf') ? '📄' : 
                         file.name.endsWith('.docx') ? '📝' : '📃'}
                      </span>
                      <div className="upload-file-details">
                        <div className="upload-file-name">{file.name}</div>
                        <div className="upload-file-size">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      className="upload-remove-button"
                      onClick={() => removeFile(index)}
                      whileHover={{ scale: 1.1, background: '#dc2626' }}
                      whileTap={{ scale: 0.9 }}
                    >
                      Remove
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                className={`upload-submit-button ${uploading ? 'disabled' : ''}`}
                onClick={handleUpload}
                disabled={uploading}
                whileHover={!uploading ? { scale: 1.05 } : {}}
                whileTap={!uploading ? { scale: 0.95 } : {}}
              >
                {uploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="upload-loading-spinner" />
                    Uploading...
                  </div>
                ) : (
                  `🚀 Upload ${files.length} File(s)`
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Report */}
        <AnimatePresence>
          {uploadReport && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="upload-report-container"
            >
              <h2 className="upload-report-title">✨ Upload Complete!</h2>

              <motion.div
                className="upload-report-summary"
                variants={containerVariants}
              >
                <motion.div
                  variants={itemVariants}
                  className="upload-report-stat upload-report-stat-total"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="upload-stat-number">{uploadReport.total_files}</div>
                  <div className="upload-stat-label">Total Files</div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="upload-report-stat upload-report-stat-success"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="upload-stat-number upload-stat-number-success">
                    {uploadReport.successful}
                  </div>
                  <div className="upload-stat-label">Successful</div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="upload-report-stat upload-report-stat-failed"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="upload-stat-number upload-stat-number-failed">
                    {uploadReport.failed}
                  </div>
                  <div className="upload-stat-label">Failed</div>
                </motion.div>
              </motion.div>

              <div className="upload-report-details">
                <h3 className="upload-report-details-title">📋 Details</h3>
                <AnimatePresence>
                  {uploadReport.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      variants={fileItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="upload-report-item"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="upload-detail-info">
                        <div className="upload-file-name">{detail.filename}</div>
                        {detail.status === 'success' && (
                          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                            {detail.chunks} chunks • {detail.time}
                          </div>
                        )}
                        {detail.error && (
                          <div className="upload-detail-error">
                            {detail.error}
                          </div>
                        )}
                      </div>
                      <span
                        className={`upload-status-badge ${
                          detail.status === 'success'
                            ? 'upload-status-success'
                            : 'upload-status-failed'
                        }`}
                      >
                        {detail.status === 'success' ? '✓ Success' : '✗ Failed'}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {uploadReport.successful > 0 && (
                <motion.button
                  variants={itemVariants}
                  className="upload-continue-button"
                  onClick={() => navigate('/chat')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue to Chat →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default UploadPage;
