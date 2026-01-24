import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiArrowLeft, 
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAward,
  FiTarget,
  FiBook
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function PracticeQuiz({ userType }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const navigate = useNavigate();

  useEffect(() => {
    if (userType !== 'student') {
      navigate('/chat');
      return;
    }
    fetchAvailableTopics();
  }, [userType, navigate]);

  const fetchAvailableTopics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/practice-quiz/topics`);
      setAvailableTopics(response.data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/practice-quiz/generate`,
        null,
        {
          params: {
            topic: selectedTopic || undefined,
            num_questions: numQuestions,
            difficulty: difficulty
          }
        }
      );
      setQuestions(response.data.questions);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setScore(0);
      setQuizCompleted(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    
    const currentQ = questions[currentQuestion];
    if (selectedAnswer === currentQ.correct_answer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    setQuizStarted(false);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreEmoji = (percentage) => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '📚';
    return '💪';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
    },
    header: {
      maxWidth: '900px',
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
    content: {
      maxWidth: '900px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    setupContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '25px',
    },
    setupTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    setupSubtitle: {
      fontSize: '15px',
      color: '#6b7280',
      marginBottom: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    select: {
      padding: '14px 16px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: 'white',
      color: '#1f2937',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    input: {
      padding: '14px 16px',
      fontSize: '15px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: 'white',
      color: '#1f2937',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    difficultyButtons: {
      display: 'flex',
      gap: '10px',
    },
    difficultyButton: {
      flex: 1,
      padding: '14px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    difficultyButtonActive: {
      background: '#667eea',
      borderColor: '#667eea',
      color: 'white',
    },
    startButton: {
      padding: '18px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
      marginTop: '10px',
    },
    progressBar: {
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '30px',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      transition: 'width 0.3s',
    },
    questionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
    },
    questionNumber: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#667eea',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    questionScore: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280',
    },
    questionText: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: '1.6',
      marginBottom: '30px',
    },
    optionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '25px',
    },
    option: {
      padding: '18px 20px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      color: '#1f2937',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    optionSelected: {
      borderColor: '#667eea',
      background: '#f0f9ff',
    },
    optionCorrect: {
      borderColor: '#10b981',
      background: '#d1fae5',
    },
    optionWrong: {
      borderColor: '#ef4444',
      background: '#fee2e2',
    },
    optionLetter: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '14px',
      color: '#6b7280',
      flexShrink: 0,
    },
    optionText: {
      flex: 1,
    },
    optionIcon: {
      flexShrink: 0,
    },
    explanation: {
      background: '#f0f9ff',
      border: '2px solid #bae6fd',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '20px',
    },
    explanationTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#0c4a6e',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    explanationText: {
      fontSize: '15px',
      color: '#0c4a6e',
      lineHeight: '1.6',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
    },
    submitButton: {
      flex: 1,
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    submitButtonDisabled: {
      background: '#d1d5db',
      cursor: 'not-allowed',
    },
    nextButton: {
      flex: 1,
      padding: '16px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    resultsContainer: {
      textAlign: 'center',
    },
    resultsEmoji: {
      fontSize: '100px',
      marginBottom: '20px',
    },
    resultsTitle: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: '15px',
    },
    resultsScore: {
      fontSize: '64px',
      fontWeight: '900',
      marginBottom: '10px',
    },
    resultsText: {
      fontSize: '18px',
      color: '#6b7280',
      marginBottom: '40px',
    },
    resultsButtons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
    },
    dotsContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    dot: {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: '#667eea',
    },
    loadingText: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '600',
    },
  };

  if (userType !== 'student') {
    return null;
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <motion.button
          style={styles.backButton}
          onClick={() => navigate('/student-analytics')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Analytics
        </motion.button>

        <h1 style={styles.headerTitle}>🎯 Practice Quiz</h1>
      </div>

      <motion.div
        style={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!quizStarted && !loading && (
          <div style={styles.setupContainer}>
            <div>
              <h2 style={styles.setupTitle}>
                <FiTarget />
                Start Your Practice Quiz
              </h2>
              <p style={styles.setupSubtitle}>
                Test your knowledge with AI-generated questions from your study materials
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Topic (Optional)</label>
              <select
                style={styles.select}
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="">All Topics</option>
                {availableTopics.weak_topics?.map((topic, idx) => (
                  <option key={idx} value={topic}>
                    ⚠️ {topic} (Needs Review)
                  </option>
                ))}
                {availableTopics.all_topics?.map((topic, idx) => (
                  <option key={idx} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Questions</label>
              <input
                type="number"
                style={styles.input}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                min="1"
                max="20"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Difficulty Level</label>
              <div style={styles.difficultyButtons}>
                {['easy', 'medium', 'hard'].map((level) => (
                  <motion.button
                    key={level}
                    style={{
                      ...styles.difficultyButton,
                      ...(difficulty === level ? styles.difficultyButtonActive : {}),
                    }}
                    onClick={() => setDifficulty(level)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              style={styles.startButton}
              onClick={startQuiz}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Quiz
            </motion.button>
          </div>
        )}

        {loading && (
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
            <div style={styles.loadingText}>Generating your quiz...</div>
          </div>
        )}

        {quizStarted && !quizCompleted && currentQ && (
          <>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>

            <div style={styles.questionHeader}>
              <div style={styles.questionNumber}>
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div style={styles.questionScore}>
                Score: {score}/{questions.length}
              </div>
            </div>

            <div style={styles.questionText}>{currentQ.question}</div>

            <div style={styles.optionsList}>
              {Object.entries(currentQ.options).map(([letter, text]) => {
                const isSelected = selectedAnswer === letter;
                const isCorrect = letter === currentQ.correct_answer;
                const showResult = showExplanation;

                let optionStyle = styles.option;
                if (showResult) {
                  if (isCorrect) {
                    optionStyle = { ...styles.option, ...styles.optionCorrect };
                  } else if (isSelected) {
                    optionStyle = { ...styles.option, ...styles.optionWrong };
                  }
                } else if (isSelected) {
                  optionStyle = { ...styles.option, ...styles.optionSelected };
                }

                return (
                  <motion.div
                    key={letter}
                    style={optionStyle}
                    onClick={() => handleAnswerSelect(letter)}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div style={styles.optionLetter}>{letter}</div>
                    <div style={styles.optionText}>{text}</div>
                    {showResult && isCorrect && (
                      <FiCheck size={24} color="#10b981" style={styles.optionIcon} />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <FiX size={24} color="#ef4444" style={styles.optionIcon} />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {showExplanation && (
              <motion.div
                style={styles.explanation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={styles.explanationTitle}>
                  {selectedAnswer === currentQ.correct_answer ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <div style={styles.explanationText}>{currentQ.explanation}</div>
              </motion.div>
            )}

            <div style={styles.actionButtons}>
              {!showExplanation ? (
                <motion.button
                  style={{
                    ...styles.submitButton,
                    ...(selectedAnswer ? {} : styles.submitButtonDisabled),
                  }}
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  whileHover={selectedAnswer ? { scale: 1.02 } : {}}
                  whileTap={selectedAnswer ? { scale: 0.98 } : {}}
                >
                  <FiCheck size={20} />
                  Submit Answer
                </motion.button>
              ) : (
                <motion.button
                  style={styles.nextButton}
                  onClick={handleNextQuestion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentQuestion < questions.length - 1 ? (
                    <>Next Question →</>
                  ) : (
                    <>View Results</>
                  )}
                </motion.button>
              )}
            </div>
          </>
        )}

        {quizCompleted && (
          <motion.div
            style={styles.resultsContainer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={styles.resultsEmoji}>
              {getScoreEmoji((score / questions.length) * 100)}
            </div>
            <h2 style={styles.resultsTitle}>Quiz Complete!</h2>
            <div
              style={{
                ...styles.resultsScore,
                color: getScoreColor((score / questions.length) * 100),
              }}
            >
              {score}/{questions.length}
            </div>
            <p style={styles.resultsText}>
              You scored {((score / questions.length) * 100).toFixed(0)}%
            </p>

            <div style={styles.resultsButtons}>
              <motion.button
                style={styles.submitButton}
                onClick={resetQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={20} />
                Try Again
              </motion.button>
              <motion.button
                style={styles.nextButton}
                onClick={() => navigate('/student-analytics')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiAward size={20} />
                View Analytics
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default PracticeQuiz;
