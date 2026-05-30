import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UploadPage from './components/UploadPage';
import ChatPage from './components/ChatPage';
import KnowledgeGaps from './components/KnowledgeGaps';
import StudentAnalytics from './components/StudentAnalytics';
import PracticeQuiz from './components/PracticeQuiz';
import './styles/theme.css';
import './App.css';
import './styles/components.css';

// Theme Context
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('workmaster-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('workmaster-theme', theme);
    
    // Add transition class briefly for smooth switch
    document.body.classList.add('theme-transitioning');
    const timer = setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AppContent() {
  const [userType, setUserType] = useState('student');
  const [chatMessages, setChatMessages] = useState([]);
  const [prevUserType, setPrevUserType] = useState('student');

  // ✅ Clear chat when user type changes
  useEffect(() => {
    if (prevUserType !== userType) {
      setChatMessages([]);
      setPrevUserType(userType);
    }
  }, [userType, prevUserType]);

  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<LandingPage setUserType={setUserType} />} />
        <Route path="/upload" element={<UploadPage userType={userType} />} />
        <Route 
          path="/chat" 
          element={
            <ChatPage 
              userType={userType} 
              messages={chatMessages}
              setMessages={setChatMessages}
            />
          } 
        />
        <Route path="/knowledge-gaps" element={<KnowledgeGaps userType={userType} />} />
        <Route path="/student-analytics" element={<StudentAnalytics userType={userType} />} />
        <Route path="/practice-quiz" element={<PracticeQuiz userType={userType} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
