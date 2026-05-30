import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FiArrowLeft, 
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiAward,
  FiTarget
} from 'react-icons/fi';
import '../styles/quiz.css';

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

  if (userType !== 'student') {
    return null;
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      {/* Styles now in quiz.css */}

      <div className="quiz-header">
        <motion.button
          className="quiz-back-button"
          onClick={() => navigate('/student-analytics')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft size={18} />
          Back to Analytics
        </motion.button>

        <h1 className="quiz-header-title">🎯 Practice Quiz</h1>
      </div>

      <motion.div
        className="quiz-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!quizStarted && !loading && (
          <div className="quiz-setup-container">
            <div>
              <h2 className="quiz-setup-title">
                <FiTarget />
                Start Your Practice Quiz
              </h2>
              <p className="quiz-setup-subtitle">
                Test your knowledge with AI-generated questions from your study materials
              </p>
            </div>

            <div className="quiz-form-group">
              <label className="quiz-label">Topic (Optional)</label>
              <select
                className="quiz-select"
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

            <div className="quiz-form-group">
              <label className="quiz-label">Number of Questions</label>
              <input
                type="number"
                className="quiz-input"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                min="1"
                max="20"
              />
            </div>

            <div className="quiz-form-group">
              <label className="quiz-label">Difficulty Level</label>
              <div className="quiz-difficulty-buttons">
                {['easy', 'medium', 'hard'].map((level) => (
                  <motion.button
                    key={level}
                    className={`quiz-difficulty-button ${difficulty === level ? 'active' : ''}`}
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
              className="quiz-start-button"
              onClick={startQuiz}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Quiz
            </motion.button>
          </div>
        )}

        {loading && (
          <div className="quiz-loading-container">
            <div className="quiz-dots-container">
              <motion.div
                className="quiz-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <motion.div
                className="quiz-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="quiz-dot"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <div className="quiz-loading-text">Generating your quiz...</div>
          </div>
        )}

        {quizStarted && !quizCompleted && currentQ && (
          <>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="quiz-question-header">
              <div className="quiz-question-number">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div className="quiz-question-score">
                Score: {score}/{questions.length}
              </div>
            </div>

            <div className="quiz-question-text">{currentQ.question}</div>

            <div className="quiz-options-list">
              {Object.entries(currentQ.options).map(([letter, text]) => {
                const isSelected = selectedAnswer === letter;
                const isCorrect = letter === currentQ.correct_answer;
                const showResult = showExplanation;

                let optionClasses = 'quiz-option';
                if (showResult) {
                  if (isCorrect) {
                    optionClasses += ' correct';
                  } else if (isSelected) {
                    optionClasses += ' wrong';
                  }
                  optionClasses += ' disabled';
                } else if (isSelected) {
                  optionClasses += ' selected';
                }

                return (
                  <motion.div
                    key={letter}
                    className={optionClasses}
                    onClick={() => handleAnswerSelect(letter)}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="quiz-option-letter">{letter}</div>
                    <div className="quiz-option-text">{text}</div>
                    {showResult && isCorrect && (
                      <FiCheck size={24} color="#10b981" className="quiz-option-icon" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <FiX size={24} color="#ef4444" className="quiz-option-icon" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {showExplanation && (
              <motion.div
                className="quiz-explanation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="quiz-explanation-title">
                  {selectedAnswer === currentQ.correct_answer ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <div className="quiz-explanation-text">{currentQ.explanation}</div>
              </motion.div>
            )}

            <div className="quiz-action-buttons">
              {!showExplanation ? (
                <motion.button
                  className="quiz-submit-button"
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
                  className="quiz-next-button"
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
            className="quiz-completed-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="quiz-completed-emoji">
              {getScoreEmoji((score / questions.length) * 100)}
            </div>
            <h2 className="quiz-completed-title">Quiz Complete!</h2>
            <div
              className="quiz-completed-score"
              style={{ color: getScoreColor((score / questions.length) * 100) }}
            >
              {score}/{questions.length}
            </div>
            <p className="quiz-completed-text">
              You scored {((score / questions.length) * 100).toFixed(0)}%
            </p>

            <div className="quiz-completed-buttons">
              <motion.button
                className="quiz-submit-button"
                onClick={resetQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={20} />
                Try Again
              </motion.button>
              <motion.button
                className="quiz-next-button"
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
