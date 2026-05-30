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
  }, [messages, loading]);

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

      console.log('✅ Chat API Response:', response.data);

      if (response.status === 200 && response.data) {
        const aiMessage = {
          type: 'ai',
          content: response.data.answer,
          sources: response.data.sources || [],
          confidence: response.data.confidence,
          confidence_level: response.data.confidence_level,
          ask_human: response.data.ask_human
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;
        
        if (status === 500) {
          errorContent = detail || 'The server encountered an error. Please try again later.';
        } else if (status === 404) {
          errorContent = 'The requested resource was not found.';
        } else if (status === 400) {
          errorContent = detail || 'Invalid request. Please check your input and try again.';
        } else {
          errorContent = detail || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        errorContent = 'No response from server. Please check your connection and try again.';
      } else {
        errorContent = 'Error setting up the request. Please try again.';
      }
      
      const errorMessage = {
        type: 'ai',
        content: errorContent,
        error: true,
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
    <div className="chat-container">
      <style>
        {`
          .chat-container {
            display: flex;
            height: 100vh;
            background: var(--color-bg-gradient);
            overflow: hidden;
          }

          .chat-sidebar {
            width: 320px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-right: 1px solid var(--color-border-light);
            display: flex;
            flex-direction: column;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .chat-sidebar-header {
            padding: 30px 25px;
            background: var(--color-emerald);
            color: white;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
          }

          .chat-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }

          .chat-logo-text {
            font-size: 24px;
            font-weight: 800;
            margin: 0;
          }

          .chat-user-type {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .chat-sidebar-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 25px;
          }

          .chat-section-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-text-secondary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .chat-button {
            width: 100%;
            padding: 14px;
            background: var(--color-emerald);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          }

          .chat-button:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
          }

          .chat-button-secondary {
            background: #f59e0b;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
            margin-bottom: 20px;
          }

          .chat-button-secondary:hover {
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
          }

          .chat-documents-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .chat-documents-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: var(--color-text-primary);
          }

          .chat-documents-count {
            background: var(--color-emerald);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }

          .chat-empty-state {
            text-align: center;
            padding: 30px 20px;
            color: var(--color-text-secondary);
            font-size: 14px;
            font-style: italic;
          }

          .chat-document-item {
            background: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease-in-out;
          }

          .chat-document-item:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .chat-document-icon {
            font-size: 28px;
            color: var(--color-emerald);
            flex-shrink: 0;
          }

          .chat-document-info {
            flex: 1;
            min-width: 0;
          }

          .chat-document-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .chat-document-pages {
            font-size: 12px;
            color: var(--color-text-secondary);
          }

          .chat-delete-button {
            padding: 8px;
            background: transparent;
            border: none;
            color: #ef4444;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .chat-delete-button:hover {
            background: rgba(239, 68, 68, 0.1);
            transform: scale(1.1);
          }

          .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.98);
            overflow: hidden;
          }

          .chat-header {
            padding: 25px 35px;
            background: white;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            flex-shrink: 0;
          }

          .chat-title {
            margin: 0 0 8px 0;
            font-size: 26px;
            font-weight: 800;
            color: var(--color-emerald);
          }

          .chat-subtitle {
            margin: 0;
            font-size: 14px;
            color: var(--color-text-secondary);
          }

          .chat-messages-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 30px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%);
          }

          .chat-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--color-text-secondary);
          }

          .chat-empty-icon {
            font-size: 80px;
            margin-bottom: 20px;
            color: var(--color-emerald);
          }

          .chat-empty-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--color-text-primary);
            margin: 0 0 10px 0;
          }

          .chat-empty-text {
            font-size: 16px;
            color: var(--color-text-secondary);
            margin: 0;
          }

          .message-wrapper {
            margin-bottom: 20px;
            display: flex;
          }

          .message-user {
            justify-content: flex-end;
          }

          .message-ai {
            justify-content: flex-start;
          }

          .message-bubble {
            max-width: 75%;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
          }

          .message-bubble-user {
            background: var(--color-emerald);
            color: white;
            padding: 18px 22px;
          }

          .message-bubble-ai {
            background: white;
            color: var(--color-text-primary);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .message-header {
            padding: 12px 18px;
            background: rgba(16, 185, 129, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .message-ai-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--color-emerald);
          }

          .message-content {
            padding: 18px 22px;
            font-size: 15px;
            line-height: 1.7;
          }

          .copy-button {
            background: transparent;
            border: none;
            padding: 6px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease-in-out;
            color: var(--color-emerald);
          }

          .copy-button:hover {
            background: rgba(16, 185, 129, 0.1);
            transform: scale(1.1);
          }

          .sources-container {
            padding: 15px 18px 18px;
            background: rgba(16, 185, 129, 0.03);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .sources-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: 12px;
          }

          .source-item {
            background: white;
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 13px;
            color: var(--color-text-primary);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .source-document {
            font-weight: 700;
            color: var(--color-emerald);
            font-size: 13px;
          }

          .source-page {
            font-size: 12px;
            color: var(--color-text-secondary);
          }

          .confidence-container {
            padding: 12px 18px;
            background: rgba(16, 185, 129, 0.03);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .confidence-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--color-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .confidence-value {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .confidence-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .confidence-percentage {
            font-size: 14px;
            font-weight: 700;
          }

          .ask-human-button {
            margin: 12px 18px 18px;
            padding: 10px 16px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease-in-out;
            width: calc(100% - 36px);
          }

          .ask-human-button:hover {
            background: #dc2626;
            transform: scale(1.02);
          }

          .error-message {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
            border-radius: 16px;
            padding: 18px 22px;
            font-size: 15px;
            line-height: 1.6;
          }

          .error-icon {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            font-weight: 600;
            color: #991b1b;
          }

          .chat-input-container {
            padding: 25px 35px;
            background: white;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
            flex-shrink: 0;
          }

          .chat-input-wrapper {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .chat-input {
            flex: 1;
            padding: 16px 20px;
            font-size: 15px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            outline: none;
            transition: all 0.3s ease-in-out;
            font-family: inherit;
            background: white;
            color: var(--color-text-primary);
          }

          .chat-input:focus {
            border-color: var(--color-emerald);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }

          .chat-send-button {
            padding: 16px 28px;
            background: var(--color-emerald);
            color: white;
            border: none;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            flex-shrink: 0;
          }

          .chat-send-button:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
          }

          .chat-send-button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
            box-shadow: none;
          }

          .loading-bubble {
            background: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px 24px;
            max-width: 120px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .dots-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--color-emerald);
          }
        `}
      </style>

      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-logo">
            <span style={{ fontSize: '28px' }}>🤖</span>
            <h1 className="chat-logo-text">WorkMaster</h1>
          </div>
          <p className="chat-user-type">
            {userType === 'company' ? 'Employer Portal' : 'Student Portal'}
          </p>
        </div>

        <div className="chat-sidebar-content">
          <motion.button
            className="chat-button"
            onClick={() => navigate('/upload')}
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <FiUpload size={18} />
            Upload Documents
          </motion.button>

          {userType === 'student' && (
            <motion.button
              className="chat-button"
              style={{ background: '#8b5cf6' }}
              onClick={() => navigate('/student-analytics')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrendingUp size={18} />
              Study Analytics
            </motion.button>
          )}

          {userType === 'company' && (
            <motion.button
              className="chat-button chat-button-secondary"
              onClick={() => navigate('/knowledge-gaps')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrendingDown size={18} />
              Knowledge Gaps
            </motion.button>
          )}

          <div className="chat-section-label">Your Documents</div>
          
          <div className="chat-documents-header">
            <div className="chat-documents-title">
              <FiFile size={16} />
              Documents
            </div>
            <div className="chat-documents-count">{documents.length}</div>
          </div>

          {documents.length === 0 ? (
            <div className="chat-empty-state">
              No documents uploaded yet
            </div>
          ) : (
            <AnimatePresence>
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.filename}
                  className="chat-document-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="chat-document-icon">
                    {doc.file_type === '.pdf' ? '📄' : 
                     doc.file_type === '.docx' ? '📝' : '📃'}
                  </div>
                  <div className="chat-document-info">
                    <div className="chat-document-name" title={doc.filename}>
                      {doc.filename}
                    </div>
                    <div className="chat-document-pages">
                      {doc.chunk_count} chunks
                    </div>
                  </div>
                  <motion.button
                    className="chat-delete-button"
                    onClick={() => handleDeleteDocument(doc.filename)}
                    disabled={deletingDoc === doc.filename}
                    whileHover={{ scale: 1.1 }}
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
      <div className="chat-area">
        <div className="chat-header">
          <h2 className="chat-title">AI Knowledge Assistant</h2>
          <p className="chat-subtitle">
            Get instant answers with source citations from your uploaded documents
          </p>
        </div>

        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <h3 className="chat-empty-title">Start a Conversation</h3>
              <p className="chat-empty-text">
                Upload documents and ask questions to get started
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`message-wrapper ${msg.type === 'user' ? 'message-user' : 'message-ai'}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {msg.type === 'user' ? (
                      <div className="message-bubble message-bubble-user">
                        <div className="message-content">{msg.content}</div>
                      </div>
                    ) : (
                      <div className={`message-bubble ${msg.error ? 'error-message' : 'message-bubble-ai'}`}>
                        {msg.error ? (
                          <>
                            <div className="error-icon">
                              <FiAlertCircle size={18} />
                              Error
                            </div>
                            <div className="message-content">{msg.content}</div>
                          </>
                        ) : (
                          <>
                            <div className="message-header">
                              <span className="message-ai-label">AI Assistant</span>
                              <motion.button
                                className="copy-button"
                                onClick={() => handleCopyToClipboard(msg.content, index)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {copiedIndex === index ? <FiCheck size={16} /> : <FiCopy size={16} />}
                              </motion.button>
                            </div>

                            <div className="message-content">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="sources-container">
                                <div className="sources-title">
                                  <FiBook size={14} />
                                  Sources
                                </div>
                                {msg.sources.map((source, idx) => (
                                  <div key={idx} className="source-item">
                                    <div className="source-document">
                                      {source.document}
                                    </div>
                                    {source.pages && source.pages.length > 0 && (
                                      <div className="source-page">
                                        {formatPages(source.pages)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {userType === 'company' && msg.confidence !== undefined && (
                              <div className="confidence-container">
                                <span className="confidence-label">Confidence</span>
                                <div className="confidence-value">
                                  <span className="confidence-percentage">
                                    {(msg.confidence * 100).toFixed(0)}%
                                  </span>
                                  <span
                                    className="confidence-badge"
                                    style={{
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
                                className="ask-human-button"
                                onClick={handleAskHuman}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FiAlertCircle size={16} />
                                Ask Human Expert
                              </motion.button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  className="message-wrapper message-ai"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="loading-bubble">
                    <div className="dots-container">
                      <motion.div
                        className="dot"
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <motion.div
                        className="dot"
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="dot"
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

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder="Ask a question about your documents..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="chat-input"
            />
            <motion.button
              className={`chat-send-button ${loading || !inputValue.trim() ? 'disabled' : ''}`}
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
