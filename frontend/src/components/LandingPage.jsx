import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function LandingPage({ setUserType }) {
  const navigate = useNavigate();

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    navigate('/upload');
  };

  // Inline Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    backgroundOrb: {
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(100px)',
      pointerEvents: 'none',
    },
    orb1: {
      width: '600px',
      height: '600px',
      background: 'rgba(118, 75, 162, 0.4)',
      top: '-200px',
      left: '-200px',
    },
    orb2: {
      width: '500px',
      height: '500px',
      background: 'rgba(102, 126, 234, 0.3)',
      bottom: '-150px',
      right: '-150px',
    },
    hero: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      position: 'relative',
      zIndex: 1,
    },
    badge: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      padding: '12px 28px',
      borderRadius: '30px',
      fontSize: '0.95rem',
      fontWeight: '600',
      letterSpacing: '0.5px',
      marginBottom: '30px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    title: {
      fontSize: '5rem',
      fontWeight: '900',
      margin: '0 0 20px 0',
      lineHeight: '1.1',
      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '1.8rem',
      margin: '0 0 15px 0',
      opacity: '0.95',
      fontWeight: '300',
    },
    description: {
      fontSize: '1.1rem',
      opacity: '0.85',
      maxWidth: '600px',
      margin: '0 auto 50px auto',
      lineHeight: '1.6',
    },
    buttonsContainer: {
      display: 'flex',
      gap: '25px',
      marginBottom: '60px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    ctaButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '22px 40px',
      fontSize: '1.1rem',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      cursor: 'pointer',
      fontWeight: '600',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s',
    },
    studentButton: {
      background: 'rgba(59, 130, 246, 0.9)',
      color: 'white',
    },
    companyButton: {
      background: 'rgba(16, 185, 129, 0.9)',
      color: 'white',
    },
    buttonIcon: {
      fontSize: '2.2rem',
    },
    buttonContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '3px',
    },
    buttonTitle: {
      fontSize: '1.2rem',
      fontWeight: '700',
    },
    buttonSubtitle: {
      fontSize: '0.85rem',
      opacity: '0.9',
      fontWeight: '400',
    },
    statsContainer: {
      display: 'flex',
      gap: '60px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: '20px',
    },
    statItem: {
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '2.8rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    statLabel: {
      fontSize: '0.95rem',
      opacity: '0.85',
      marginTop: '5px',
    },
    featuresSection: {
      padding: '100px 20px',
      background: 'white',
      color: '#333',
      position: 'relative',
      zIndex: 1,
    },
    sectionHeader: {
      textAlign: 'center',
      marginBottom: '60px',
      maxWidth: '700px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    sectionTitle: {
      fontSize: '2.8rem',
      fontWeight: '800',
      marginBottom: '15px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    sectionSubtitle: {
      fontSize: '1.15rem',
      color: '#666',
      lineHeight: '1.6',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '30px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featureCard: {
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      border: '2px solid #f0f0f0',
      transition: 'all 0.3s',
      position: 'relative',
    },
    featuredCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
    },
    featureIcon: {
      fontSize: '3.8rem',
      marginBottom: '20px',
      display: 'inline-block',
    },
    featureTitle: {
      fontSize: '1.6rem',
      fontWeight: '700',
      marginBottom: '15px',
    },
    featureDescription: {
      fontSize: '1.05rem',
      lineHeight: '1.8',
      color: '#666',
      marginBottom: '20px',
    },
    featuredDescription: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    featureBadge: {
      display: 'inline-block',
      padding: '8px 16px',
      background: '#e0e7ff',
      color: '#667eea',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    premiumBadge: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    howItWorksSection: {
      padding: '100px 20px',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
      textAlign: 'center',
    },
    stepsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
      maxWidth: '1100px',
      margin: '50px auto 0',
      flexWrap: 'wrap',
    },
    step: {
      flex: '1',
      minWidth: '220px',
      padding: '35px 25px',
      background: 'white',
      borderRadius: '18px',
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s',
    },
    stepNumber: {
      width: '70px',
      height: '70px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.8rem',
      fontWeight: '700',
      margin: '0 auto 20px',
    },
    stepTitle: {
      fontSize: '1.4rem',
      marginBottom: '10px',
      color: '#333',
      fontWeight: '600',
    },
    stepText: {
      color: '#666',
      fontSize: '1rem',
      lineHeight: '1.6',
    },
    stepArrow: {
      fontSize: '2.5rem',
      color: '#667eea',
      fontWeight: '300',
    },
    footerCta: {
      padding: '100px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textAlign: 'center',
      color: 'white',
    },
    footerTitle: {
      fontSize: '2.8rem',
      marginBottom: '15px',
      fontWeight: '800',
    },
    footerText: {
      fontSize: '1.25rem',
      opacity: '0.9',
      marginBottom: '40px',
    },
    primaryButton: {
      padding: '20px 55px',
      fontSize: '1.25rem',
      background: 'white',
      color: '#667eea',
      border: 'none',
      borderRadius: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    },
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
    <div style={styles.container}>
      {/* Background Orbs */}
      <motion.div
        style={{ ...styles.backgroundOrb, ...styles.orb1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        style={{ ...styles.backgroundOrb, ...styles.orb2 }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      {/* Hero Section */}
      <motion.div
        style={styles.hero}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div style={styles.badge} variants={itemVariants}>
          ⚡ AI-Powered Document Intelligence
        </motion.div>

        <motion.h1 style={styles.title} variants={itemVariants}>
          WorkMaster AI
        </motion.h1>

        <motion.p style={styles.subtitle} variants={itemVariants}>
          Transform Your Documents Into Instant, Intelligent Answers
        </motion.p>

        <motion.p style={styles.description} variants={itemVariants}>
          Upload PDFs, Word docs, or text files and get accurate answers instantly.
          Perfect for students, researchers, and businesses.
        </motion.p>

        <motion.div style={styles.buttonsContainer} variants={containerVariants}>
          <motion.button
            style={{ ...styles.ctaButton, ...styles.studentButton }}
            onClick={() => handleUserTypeSelect('student')}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span style={styles.buttonIcon}>🎓</span>
            <span style={styles.buttonContent}>
              <span style={styles.buttonTitle}>For Students</span>
              <span style={styles.buttonSubtitle}>Study smarter, not harder</span>
            </span>
          </motion.button>

          <motion.button
            style={{ ...styles.ctaButton, ...styles.companyButton }}
            onClick={() => handleUserTypeSelect('company')}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span style={styles.buttonIcon}>🏢</span>
            <span style={styles.buttonContent}>
              <span style={styles.buttonTitle}>For Companies</span>
              <span style={styles.buttonSubtitle}>Optimize knowledge management</span>
            </span>
          </motion.button>
        </motion.div>

      </motion.div>

      {/* Features Section */}
      <motion.div
        style={styles.featuresSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.div style={styles.sectionHeader} variants={itemVariants}>
          <h2 style={styles.sectionTitle}>Powerful Features That Set Us Apart</h2>
          <p style={styles.sectionSubtitle}>
            Enterprise-grade AI technology designed for accuracy and reliability
          </p>
        </motion.div>

        <div style={styles.featuresGrid}>
          <motion.div
            style={styles.featureCard}
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              style={styles.featureIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🎯
            </motion.div>
            <h3 style={styles.featureTitle}>Smart Source Citations</h3>
            <p style={styles.featureDescription}>
              Every answer is verified with its source document, page number, and exact location.
              Eliminate AI hallucinations and ensure 100% accuracy. Trace back to original
              content for complete verification.
            </p>
            <div style={styles.featureBadge}>Verified ✓</div>
          </motion.div>

          <motion.div
            style={{ ...styles.featureCard, ...styles.featuredCard }}
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              style={styles.featureIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              🔍
            </motion.div>
            <h3 style={styles.featureTitle}>Knowledge Gap Detector</h3>
            <p style={{ ...styles.featureDescription, ...styles.featuredDescription }}>
              Automatically identifies questions your documents can't answer. Perfect for
              businesses to improve documentation and fill knowledge gaps. Get actionable
              insights on what content is missing.
            </p>
            <div style={{ ...styles.featureBadge, ...styles.premiumBadge }}>Business Only</div>
          </motion.div>

          <motion.div
            style={styles.featureCard}
            variants={itemVariants}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
          >
            <motion.div
              style={styles.featureIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              ✅
            </motion.div>
            <h3 style={styles.featureTitle}>Confidence Score System</h3>
            <p style={styles.featureDescription}>
              Each answer displays a confidence level to prevent wrong decisions.
              Low-confidence questions are automatically routed to human experts.
              Never guess when accuracy matters.
            </p>
            <div style={styles.featureBadge}>AI-Powered</div>
          </motion.div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        style={styles.howItWorksSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <motion.h2 style={styles.sectionTitle} variants={itemVariants}>
          How It Works
        </motion.h2>

        <div style={styles.stepsContainer}>
          <motion.div style={styles.step} variants={itemVariants}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Upload Documents</h3>
            <p style={styles.stepText}>Drag and drop your PDFs, Word docs, or text files</p>
          </motion.div>

          <motion.div style={styles.stepArrow} variants={itemVariants}>→</motion.div>

          <motion.div style={styles.step} variants={itemVariants}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Ask Questions</h3>
            <p style={styles.stepText}>Type natural language questions about your content</p>
          </motion.div>

          <motion.div style={styles.stepArrow} variants={itemVariants}>→</motion.div>

          <motion.div style={styles.step} variants={itemVariants}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Get Answers</h3>
            <p style={styles.stepText}>Receive accurate answers with source citations instantly</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        style={styles.footerCta}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={styles.footerTitle}>Ready to Transform Your Documents?</h2>
        <p style={styles.footerText}>Join thousands of users making their documents intelligent</p>
        <motion.button
          style={styles.primaryButton}
          onClick={() => navigate('/upload')}
          whileHover={{ scale: 1.05, boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)' }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started Free →
        </motion.button>
      </motion.div>
    </div>
  );
}

export default LandingPage;
