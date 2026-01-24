import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UploadPage from './components/UploadPage';
import ChatPage from './components/ChatPage';
import KnowledgeGaps from './components/KnowledgeGaps';
import StudentAnalytics from './components/StudentAnalytics';
import PracticeQuiz from './components/PracticeQuiz';
import './App.css';

function AppContent() {
  const [userType, setUserType] = useState('student');
  const [chatMessages, setChatMessages] = useState([]);
  const location = useLocation();
  const [prevUserType, setPrevUserType] = useState('student');

  // ✅ Clear chat when user type changes
  useEffect(() => {
    if (prevUserType !== userType) {
      setChatMessages([]);
      setPrevUserType(userType);
    }
  }, [userType, prevUserType]);

  return (
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
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
