import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  FiSend, 
  FiTrash2, 
  FiFile, 
  FiCopy, 
  FiCheck, 
  FiUpload, 
  FiTrendingDown,
  FiTrendingUp,
  FiBook,
  FiAlertCircle
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ChatPage({ userType, messages, setMessages }) {
  const [documents, setDocuments] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`, {
        params: { user_type: userType }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  }, [userType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleDeleteDocument = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This cannot be undone.`)) {
      return;
    }

    setDeletingDoc(filename);
    try {
      await axios.delete(`${API_URL}/api/documents/${encodeURIComponent(filename)}`);
      await fetchDocuments();
      alert(`Document "${filename}" deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(`Failed to delete document: ${error.response?.data?.detail || error.message}`);
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { type: 'user', content: inputValue };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        query: inputValue,
        user_type: userType,
        session_id: 'session_' + Date.now()
      });

      const aiMessage = {
        type: 'ai',
        content: response.data.answer,
        sources: response.data.sources,
        confidence: response.data.confidence,
        confidence_level: response.data.confidence_level,
        ask_human: response.data.ask_human
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        sources: [],
        confidence: 0,
        confidence_level: 'low'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAskHuman = () => {
    alert('This question has been forwarded to a human expert. You will receive a response soon.');
  };

  const formatPages = (pages) => {
    if (!pages || pages.length === 0) return '';
    if (pages.length === 1) return `Page ${pages[0]}`;
    if (pages.length === 2) return `Pages ${pages[0]}, ${pages[1]}`;
    
    const isConsecutive = pages.every((page, i) => i === 0 || page === pages[i - 1] + 1);
    if (isConsecutive && pages.length > 2) {
      return `Pages ${pages[0]}-${pages[pages.length - 1]}`;
    }
    return `Pages ${pages.join(', ')}`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return '#10b981';
    if (confidence >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden',
    },
    sidebar: {
      width: '320px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '30px 25px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      flexShrink: 0,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    logoText: {
      fontSize: '24px',
      fontWeight: '800',
      margin: 0,
    },
    userTypeText: {
      fontSize: '13px',
      opacity: 0.9,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    sidebarContent: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '25px',
    },
    uploadButton: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '12px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    },
    knowledgeGapsButton: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '20px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
    },
    sectionLabel: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#6b7280',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    documentsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '15px',
    },
    documentsTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '700',
      color: '#1f2937',
    },
    documentsCount: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    },
    emptyState: {
      textAlign: 'center',
      padding: '30px 20px',
      color: '#9ca3af',
      fontSize: '14px',
      fontStyle: 'italic',
    },
    documentItem: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '15px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s',
    },
    documentIcon: {
      fontSize: '28px',
      color: '#667eea',
      flexShrink: 0,
    },
    documentInfo: {
      flex: 1,
      minWidth: 0,
    },
    documentName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    documentPages: {
      fontSize: '12px',
      color: '#6b7280',
    },
    deleteButton: {
      padding: '8px',
      background: 'transparent',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.98)',
      overflow: 'hidden',
    },
    chatHeader: {
      padding: '25px 35px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      flexShrink: 0,
    },
    chatTitle: {
      margin: '0 0 8px 0',
      fontSize: '26px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    chatSubtitle: {
      margin: 0,
      fontSize: '14px',
      color: '#6b7280',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '30px',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
    },
    emptyChat: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#9ca3af',
    },
    emptyIcon: {
      fontSize: '80px',
      marginBottom: '20px',
      color: '#667eea',
    },
    emptyTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#4b5563',
      margin: '0 0 10px 0',
    },
    emptyText: {
      fontSize: '16px',
      color: '#9ca3af',
      margin: 0,
    },
    messageWrapper: {
      marginBottom: '20px',
      display: 'flex',
    },
    userMessageWrapper: {
      justifyContent: 'flex-end',
    },
    aiMessageWrapper: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '75%',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      overflow: 'hidden',
    },
    userMessage: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '18px 22px',
    },
    aiMessage: {
      background: 'white',
      color: '#1f2937',
      border: '1px solid #e5e7eb',
    },
    messageHeader: {
      padding: '12px 18px',
      background: 'rgba(102, 126, 234, 0.05)',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#667eea',
    },
    messageContent: {
      padding: '18px 22px',
      fontSize: '15px',
      lineHeight: '1.7',
    },
    copyButton: {
      background: 'transparent',
      border: 'none',
      padding: '6px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
      color: '#667eea',
    },
    sourcesContainer: {
      padding: '15px 18px 18px',
      background: '#f8f9ff',
      borderTop: '1px solid #e5e7eb',
    },
    sourcesTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '12px',
    },
    sourceItem: {
      background: 'white',
      padding: '10px 12px',
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '13px',
      color: '#4b5563',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    sourceDocument: {
      fontWeight: '700',
      color: '#667eea',
      fontSize: '13px',
    },
    sourcePage: {
      fontSize: '12px',
      color: '#6b7280',
    },
    confidenceContainer: {
      padding: '12px 18px',
      background: 'rgba(102, 126, 234, 0.03)',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    confidenceLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    confidenceValue: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    confidenceBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    confidencePercentage: {
      fontSize: '14px',
      fontWeight: '700',
    },
    askHumanButton: {
      margin: '12px 18px 18px',
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s',
      width: 'calc(100% - 36px)',
    },
    inputContainer: {
      padding: '25px 35px',
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      flexShrink: 0,
    },
    inputWrapper: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      padding: '16px 20px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      outline: 'none',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    sendButton: {
      padding: '16px 28px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
      flexShrink: 0,
    },
    sendButtonDisabled: {
      background: '#d1d5db',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    loadingBubble: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '20px 24px',
      maxWidth: '120px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    dotsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    dot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: '#667eea',
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={{ fontSize: '28px' }}>🤖</span>
            <h1 style={styles.logoText}>WorkMaster</h1>
          </div>
          <p style={styles.userTypeText}>
            {userType === 'company' ? 'Employer Portal' : 'Student Portal'}
          </p>
        </div>

        <div style={styles.sidebarContent}>
          <motion.button
            style={styles.uploadButton}
            onClick={() => navigate('/upload')}
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <FiUpload size={18} />
            Upload Documents
          </motion.button>

          {/* ✅ Add Student Analytics Button after Upload Button */}
          {userType === 'student' && (
            <motion.button
              style={{
                ...styles.knowledgeGapsButton,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
              onClick={() => navigate('/student-analytics')}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrendingUp size={18} />
              Study Analytics
            </motion.button>
          )}

          {userType === 'company' && (
            <motion.button
              style={styles.knowledgeGapsButton}
              onClick={() => navigate('/knowledge-gaps')}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrendingDown size={18} />
              Knowledge Gaps
            </motion.button>
          )}

          <div style={styles.sectionLabel}>Your Documents</div>
          
          <div style={styles.documentsHeader}>
            <div style={styles.documentsTitle}>
              <FiFile size={16} />
              Documents
            </div>
            <div style={styles.documentsCount}>{documents.length}</div>
          </div>

          {documents.length === 0 ? (
            <div style={styles.emptyState}>
              No documents uploaded yet
            </div>
          ) : (
            <AnimatePresence>
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.filename}
                  style={styles.documentItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                >
                  <div style={styles.documentIcon}>
                    {doc.file_type === '.pdf' ? '📄' : 
                     doc.file_type === '.docx' ? '📝' : '📃'}
                  </div>
                  <div style={styles.documentInfo}>
                    <div style={styles.documentName} title={doc.filename}>
                      {doc.filename}
                    </div>
                    <div style={styles.documentPages}>
                      {doc.chunk_count} chunks
                    </div>
                  </div>
                  <motion.button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteDocument(doc.filename)}
                    disabled={deletingDoc === doc.filename}
                    whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {deletingDoc === doc.filename ? '...' : <FiTrash2 size={18} />}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.chatHeader}>
          <h2 style={styles.chatTitle}>AI Knowledge Assistant</h2>
          <p style={styles.chatSubtitle}>
            Get instant answers with source citations from your uploaded documents
          </p>
        </div>

        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyChat}>
              <div style={styles.emptyIcon}>💬</div>
              <h3 style={styles.emptyTitle}>Start a Conversation</h3>
              <p style={styles.emptyText}>
                Upload documents and ask questions to get started
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    style={{
                      ...styles.messageWrapper,
                      ...(msg.type === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper),
                    }}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {msg.type === 'user' ? (
                      <div style={{ ...styles.messageBubble, ...styles.userMessage }}>
                        <div style={styles.messageContent}>{msg.content}</div>
                      </div>
                    ) : (
                      <div style={{ ...styles.messageBubble, ...styles.aiMessage }}>
                        <div style={styles.messageHeader}>
                          <span style={styles.aiLabel}>AI Assistant</span>
                          <motion.button
                            style={styles.copyButton}
                            onClick={() => handleCopyToClipboard(msg.content, index)}
                            whileHover={{ scale: 1.1, background: 'rgba(102, 126, 234, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {copiedIndex === index ? <FiCheck size={16} /> : <FiCopy size={16} />}
                          </motion.button>
                        </div>

                        <div style={styles.messageContent}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div style={styles.sourcesContainer}>
                            <div style={styles.sourcesTitle}>
                              <FiBook size={14} />
                              Sources
                            </div>
                            {msg.sources.map((source, idx) => (
                              <div key={idx} style={styles.sourceItem}>
                                <div style={styles.sourceDocument}>
                                  {source.document}
                                </div>
                                {source.pages && source.pages.length > 0 && (
                                  <div style={styles.sourcePage}>
                                    {formatPages(source.pages)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ✅ Confidence Score for Company Users Only */}
                        {userType === 'company' && msg.confidence !== undefined && (
                          <div style={styles.confidenceContainer}>
                            <span style={styles.confidenceLabel}>Confidence</span>
                            <div style={styles.confidenceValue}>
                              <span style={styles.confidencePercentage}>
                                {(msg.confidence * 100).toFixed(0)}%
                              </span>
                              <span
                                style={{
                                  ...styles.confidenceBadge,
                                  background: getConfidenceColor(msg.confidence) + '20',
                                  color: getConfidenceColor(msg.confidence),
                                }}
                              >
                                {getConfidenceLabel(msg.confidence)}
                              </span>
                            </div>
                          </div>
                        )}

                        {msg.ask_human && userType === 'company' && (
                          <motion.button
                            style={styles.askHumanButton}
                            onClick={handleAskHuman}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiAlertCircle size={16} />
                            Ask Human Expert
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* ✅ Loading Animation with 3 Dots Wave */}
              {loading && (
                <motion.div
                  style={{ ...styles.messageWrapper, ...styles.aiMessageWrapper }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={styles.loadingBubble}>
                    <div style={styles.dotsContainer}>
                      <motion.div
                        style={styles.dot}
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <motion.div
                        style={styles.dot}
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        style={styles.dot}
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Ask a question about your documents..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
            />
            <motion.button
              style={{
                ...styles.sendButton,
                ...(loading || !inputValue.trim() ? styles.sendButtonDisabled : {}),
              }}
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              whileHover={!loading && inputValue.trim() ? { scale: 1.05 } : {}}
              whileTap={!loading && inputValue.trim() ? { scale: 0.95 } : {}}
            >
              <FiSend size={18} />
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
