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
      // ✅ Use userType directly - it's already "company" or "student"
      const response = await axios.post(
        `${API_URL}/api/upload?user_type=${userType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      setUploadReport(response.data);
      setFiles([]);
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

  // Inline Styles
  const styles = {
    container: {
      minHeight: '100vh',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    backgroundOrb: {
      position: 'fixed',
      borderRadius: '50%',
      filter: 'blur(120px)',
      pointerEvents: 'none',
      zIndex: 0,
    },
    orb1: {
      width: '500px',
      height: '500px',
      background: 'rgba(118, 75, 162, 0.4)',
      top: '-100px',
      right: '-100px',
    },
    orb2: {
      width: '400px',
      height: '400px',
      background: 'rgba(102, 126, 234, 0.3)',
      bottom: '-100px',
      left: '-100px',
    },
    contentWrapper: {
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
      paddingBottom: '60px',
    },
    header: {
      textAlign: 'center',
      marginBottom: '50px',
      color: 'white',
    },
    title: {
      fontSize: '3.5rem',
      fontWeight: '900',
      margin: '0 0 15px 0',
      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '1.2rem',
      opacity: '0.9',
      fontWeight: '300',
    },
    uploadZone: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '3px dashed #cbd5e1',
      borderRadius: '24px',
      padding: '60px 40px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginBottom: '30px',
    },
    uploadZoneDragOver: {
      background: 'rgba(102, 126, 234, 0.1)',
      border: '3px dashed #667eea',
      transform: 'scale(1.02)',
    },
    uploadIcon: {
      fontSize: '5rem',
      marginBottom: '20px',
    },
    uploadTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '10px',
    },
    uploadSubtitle: {
      fontSize: '1.1rem',
      color: '#6b7280',
      marginBottom: '20px',
    },
    formatBadge: {
      display: 'inline-block',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: '600',
      margin: '0 5px',
    },
    fileInput: {
      display: 'none',
    },
    fileListContainer: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '30px',
      marginBottom: '30px',
    },
    fileListHeader: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    fileItem: {
      background: 'white',
      border: '2px solid #f3f4f6',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.3s',
    },
    fileInfo: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    fileIcon: {
      fontSize: '2.5rem',
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '5px',
      wordBreak: 'break-word',
    },
    fileSize: {
      fontSize: '0.9rem',
      color: '#6b7280',
    },
    removeButton: {
      padding: '10px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    uploadButton: {
      width: '100%',
      padding: '18px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '1.2rem',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'all 0.3s',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
    },
    uploadButtonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    reportContainer: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '40px',
      marginBottom: '30px',
    },
    reportTitle: {
      fontSize: '2rem',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: '30px',
      textAlign: 'center',
    },
    reportSummary: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '40px',
    },
    reportStat: {
      background: 'white',
      padding: '30px',
      borderRadius: '16px',
      textAlign: 'center',
      border: '2px solid #f3f4f6',
      transition: 'all 0.3s',
    },
    reportStatTotal: {
      borderColor: '#667eea',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    reportStatSuccess: {
      borderColor: '#10b981',
    },
    reportStatFailed: {
      borderColor: '#ef4444',
    },
    statNumber: {
      fontSize: '3rem',
      fontWeight: '800',
      marginBottom: '10px',
    },
    statLabel: {
      fontSize: '1rem',
      fontWeight: '600',
      opacity: '0.8',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    reportDetails: {
      marginTop: '30px',
    },
    reportDetailsTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '20px',
    },
    reportItem: {
      background: 'white',
      border: '2px solid #f3f4f6',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusBadge: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    statusSuccess: {
      background: '#d1fae5',
      color: '#065f46',
    },
    statusFailed: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    continueButton: {
      width: '100%',
      padding: '18px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '1.2rem',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '30px',
      transition: 'all 0.3s',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
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
    <div style={styles.container}>
      {/* Background Orbs */}
      <div style={{ ...styles.backgroundOrb, ...styles.orb1 }} />
      <div style={{ ...styles.backgroundOrb, ...styles.orb2 }} />

      {/* CSS Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          body {
            overflow-x: hidden;
          }
        `}
      </style>

      <motion.div
        style={styles.contentWrapper}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={styles.header}>
          <h1 style={styles.title}>Upload Your Documents</h1>
          <p style={styles.subtitle}>
            {/* ✅ Display name - internally still uses "company" */}
            {userType === 'company' ? 'Employer Portal' : 'Student Portal'}
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          variants={itemVariants}
          style={{
            ...styles.uploadZone,
            ...(dragOver ? styles.uploadZoneDragOver : {}),
          }}
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover="hover"
          animate={dragOver ? 'drag' : 'normal'}
          variants={uploadZoneVariants}
        >
          <motion.div
            style={styles.uploadIcon}
            animate={dragOver ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {dragOver ? '📂' : '☁️'}
          </motion.div>
          <h3 style={styles.uploadTitle}>
            {dragOver ? 'Drop your files here!' : 'Drag & Drop Files Here'}
          </h3>
          <p style={styles.uploadSubtitle}>or click to browse</p>
          <div>
            <span style={styles.formatBadge}>PDF</span>
            <span style={styles.formatBadge}>DOCX</span>
            <span style={styles.formatBadge}>TXT</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            style={styles.fileInput}
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
              style={styles.fileListContainer}
            >
              <div style={styles.fileListHeader}>
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
                    style={styles.fileItem}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div style={styles.fileInfo}>
                      <span style={styles.fileIcon}>
                        {file.name.endsWith('.pdf') ? '📄' : 
                         file.name.endsWith('.docx') ? '📝' : '📃'}
                      </span>
                      <div style={styles.fileDetails}>
                        <div style={styles.fileName}>{file.name}</div>
                        <div style={styles.fileSize}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      style={styles.removeButton}
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
                style={{
                  ...styles.uploadButton,
                  ...(uploading ? styles.uploadButtonDisabled : {}),
                }}
                onClick={handleUpload}
                disabled={uploading}
                whileHover={!uploading ? { scale: 1.05 } : {}}
                whileTap={!uploading ? { scale: 0.95 } : {}}
              >
                {uploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={styles.loadingSpinner} />
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
              style={styles.reportContainer}
            >
              <h2 style={styles.reportTitle}>✨ Upload Complete!</h2>

              <motion.div
                style={styles.reportSummary}
                variants={containerVariants}
              >
                <motion.div
                  variants={itemVariants}
                  style={{ ...styles.reportStat, ...styles.reportStatTotal }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div style={styles.statNumber}>{uploadReport.total_files}</div>
                  <div style={styles.statLabel}>Total Files</div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  style={{ ...styles.reportStat, ...styles.reportStatSuccess }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div style={{ ...styles.statNumber, color: '#10b981' }}>
                    {uploadReport.successful}
                  </div>
                  <div style={styles.statLabel}>Successful</div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  style={{ ...styles.reportStat, ...styles.reportStatFailed }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div style={{ ...styles.statNumber, color: '#ef4444' }}>
                    {uploadReport.failed}
                  </div>
                  <div style={styles.statLabel}>Failed</div>
                </motion.div>
              </motion.div>

              <div style={styles.reportDetails}>
                <h3 style={styles.reportDetailsTitle}>📋 Details</h3>
                <AnimatePresence>
                  {uploadReport.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      variants={fileItemVariants}
                      initial="hidden"
                      animate="visible"
                      style={styles.reportItem}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div>
                        <div style={styles.fileName}>{detail.filename}</div>
                        {detail.status === 'success' && (
                          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                            {detail.chunks} chunks • {detail.time}
                          </div>
                        )}
                        {detail.error && (
                          <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                            {detail.error}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(detail.status === 'success'
                            ? styles.statusSuccess
                            : styles.statusFailed),
                        }}
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
                  style={styles.continueButton}
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
