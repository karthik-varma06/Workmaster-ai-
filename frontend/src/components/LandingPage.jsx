import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AIHero3D from './AIHero3D';
import '../styles/landing.css';

function LandingPage({ setUserType }) {
  const navigate = useNavigate();

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    navigate('/upload');
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' },
    tap: { scale: 0.95 }
  };

  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <motion.div
        className="background-orb orb-1"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="background-orb orb-2"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      {/* Hero Section with 3D AI Face */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Column: Text Content */}
          <motion.div
            className="hero-content-left"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="hero-badge" variants={itemVariants}>
              ⚡ AI-Powered Document Intelligence
            </motion.div>

            <motion.h1 className="hero-title" variants={itemVariants}>
              WorkMaster AI
            </motion.h1>

            <motion.p className="hero-subtitle" variants={itemVariants}>
              Transform Your Documents Into Instant, Intelligent Answers
            </motion.p>

            <motion.p className="hero-description" variants={itemVariants}>
              Upload PDFs, Word docs, or text files and get accurate answers instantly.
              Perfect for students, researchers, and businesses.
            </motion.p>

            <motion.div className="hero-buttons-container" variants={containerVariants}>
              <motion.button
                className="cta-button cta-button-student"
                onClick={() => handleUserTypeSelect('student')}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span className="button-icon">🎓</span>
                <span className="button-content">
                  <span className="button-title">For Students</span>
                  <span className="button-subtitle">Study smarter, not harder</span>
                </span>
              </motion.button>

              <motion.button
                className="cta-button cta-button-company"
                onClick={() => handleUserTypeSelect('company')}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span className="button-icon">🏢</span>
                <span className="button-content">
                  <span className="button-title">For Companies</span>
                  <span className="button-subtitle">Optimize knowledge management</span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Column: 3D Hero */}
          <div className="hero-content-right">
            <AIHero3D />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section
        className="features-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.div className="section-header" variants={itemVariants}>
          <h2 className="section-title">Powerful Features That Set Us Apart</h2>
          <p className="section-subtitle">
            Enterprise-grade AI technology designed for accuracy and reliability
          </p>
        </motion.div>

        <div className="features-grid">
          <motion.div
            className="feature-card"
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              className="feature-icon"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🎯
            </motion.div>
            <h3 className="feature-title">Smart Source Citations</h3>
            <p className="feature-description">
              Every answer is verified with its source document, page number, and exact location.
              Eliminate AI hallucinations and ensure 100% accuracy. Trace back to original
              content for complete verification.
            </p>
            <div className="feature-badge">Verified ✓</div>
          </motion.div>

          <motion.div
            className="feature-card feature-card-featured"
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              className="feature-icon"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🔍
            </motion.div>
            <h3 className="feature-title">Knowledge Gap Detector</h3>
            <p className="feature-description feature-description-featured">
              Automatically identifies questions your documents can't answer. Perfect for
              businesses to improve documentation and fill knowledge gaps. Get actionable
              insights on what content is missing.
            </p>
            <div className="feature-badge feature-badge-featured">Business Only</div>
          </motion.div>

          <motion.div
            className="feature-card"
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              className="feature-icon"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              ✅
            </motion.div>
            <h3 className="feature-title">Confidence Score System</h3>
            <p className="feature-description">
              Each answer displays a confidence level to prevent wrong decisions.
              Low-confidence questions are automatically routed to human experts.
              Never guess when accuracy matters.
            </p>
            <div className="feature-badge">AI-Powered</div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        className="how-it-works-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.h2 className="section-title" variants={itemVariants}>
          How It Works
        </motion.h2>

        <div className="steps-container">
          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">1</div>
            <h3 className="step-title">Upload Documents</h3>
            <p className="step-text">Drag and drop your PDFs, Word docs, or text files</p>
          </motion.div>

          <motion.div className="step-arrow" variants={itemVariants}>→</motion.div>

          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">2</div>
            <h3 className="step-title">Ask Questions</h3>
            <p className="step-text">Type natural language questions about your content</p>
          </motion.div>

          <motion.div className="step-arrow" variants={itemVariants}>→</motion.div>

          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">3</div>
            <h3 className="step-title">Get Answers</h3>
            <p className="step-text">Receive accurate answers with source citations instantly</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer CTA */}
      <motion.section
        className="footer-cta-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="footer-title">Ready to Transform Your Documents?</h2>
        <p className="footer-text">Join thousands of users making their documents intelligent</p>
        <motion.button
          className="primary-button"
          onClick={() => navigate('/upload')}
          whileHover={{ scale: 1.05, boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)' }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started Free →
        </motion.button>
      </motion.section>
    </div>
  );
}

export default LandingPage;
