import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, sendChatMessage, getLiveCapacity, getMyStats, getMyLatestRoutine } from '../../services/api';
import QRScannerModal from '../kiosk/QRScannerModal';
import toast from 'react-hot-toast';
import styles from './MemberDashboard.module.css';

const MemberDashboardPage = () => {
  const navigate = useNavigate();

  // Dashboard Data State
  const [profile, setProfile] = useState(null);
  const [capacity, setCapacity] = useState(0);
  const [stats, setStats] = useState({ attendedThisWeek: 0, weekStreak: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Modal State
  const [showQRModal, setShowQRModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  // Fetch Dashboard Data on Mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileData, capacityData, statsData] = await Promise.all([
          getMyProfile(),
          getLiveCapacity(),
          getMyStats()
        ]);
        
        setProfile(profileData);
        setCapacity(typeof capacityData === 'number' ? capacityData : (capacityData?.capacity || 0));
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();

    // Optionally poll capacity every 60 seconds
    const interval = setInterval(async () => {
      try {
        const res = await getLiveCapacity();
        setCapacity(typeof res === 'number' ? res : (res?.capacity || 0));
      } catch (e) {
        // Silent fail for polling
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Chat Handler
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');
    setChatError(null);

    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await sendChatMessage(userText);
      setMessages([...newMessages, { sender: 'ai', text: response.response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatError(err.message || "KG Coach is resting right now. Try again in a few minutes! 💪");
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewWorkout = async () => {
    try {
      const res = await getMyLatestRoutine();
      if (res && res.hasRoutine) {
        navigate('/member/calendar'); // Assuming calendar shows the routine
      } else {
        toast.error('No workout saved!');
      }
    } catch (err) {
      toast.error('Could not verify your workouts.');
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      
      {/* 1. Very Top Capsule: Live Gym Load */}
      <div className={styles.liveGymCapsule}>
        <div className={styles.liveDot}></div>
        <div className={styles.capacityText}>
          LIVE LOAD: <span>{capacity}</span> Members
        </div>
      </div>

      {/* 2. Top Header Row: Welcome & Profile */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.welcomeText}>
            {isLoadingData ? '...' : (profile?.firstName ? profile.firstName.toUpperCase() : 'USER')}
          </h1>
          <p className={styles.subtitle}>To Kabakal Gym, where your routines, your records, and your community—all in one place.</p>
        </div>
        <img 
          src={profile?.profilePictureUrl || "/assets/placeholderforpfp.png"} 
          alt="Profile" 
          className={styles.profileCircle} 
          onClick={() => navigate('/member/profile')}
        />
      </div>

      {/* 3. Center Stats Box (2-panel real streak) */}
      <div className={styles.statsBox}>
        <div className={styles.statPanel}>
          <svg className={styles.statIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <div>
            <div className={styles.statValue}>{stats.attendedThisWeek}</div>
            <div className={styles.statLabel}>Sessions This Week</div>
          </div>
        </div>
        
        <div className={styles.statPanel}>
          <svg className={styles.statIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          <div>
            <div className={styles.statValue}>{stats.weekStreak}</div>
            <div className={styles.statLabel}>Week Streak</div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className={styles.actionButtonsRow}>
        <button className={styles.scanBtn} onClick={() => setShowQRModal(true)}>
          SCAN QR-CODE
        </button>
        <button className={styles.workoutBtn} onClick={handleViewWorkout}>
          VIEW SAVED WORKOUT
        </button>
      </div>

      {/* 5. Massive Desktop Grid */}
      <div className={styles.splitGrid}>
        
        {/* Left Side: AI CHATBOT */}
        <div className={styles.chatBoxWrapper}>
          <div className={styles.chatBoxHeader}>
            <h2 className={styles.chatBoxTitle}>AI CHATBOT</h2>
          </div>

          <div className={styles.chatBoxContent}>
            {messages.length === 0 && !chatLoading && !chatError && (
              <div className={styles.emptyState}>
                <p style={{ color: '#f7f014', margin: '5px 0' }}>Start a conversation with KG Coach!</p>
                <p style={{ fontSize: '12px', margin: 0, marginBottom: '15px' }}>Ask for fitness advice, nutrition tips, or daily motivation.</p>
                <button 
                  onClick={() => navigate('/member/workout-generator')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #f7f014',
                    color: '#f7f014',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontFamily: "'Archive', sans-serif",
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => { e.target.style.background = '#f7f014'; e.target.style.color = '#060407'; }}
                  onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#f7f014'; }}
                >
                  Generate Workout
                </button>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.user : styles.ai}`}>
                <div className={styles.messageBubble}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className={styles.typingIndicator}>KG Coach is thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.chatBoxInputArea} onSubmit={handleSendChat}>
            <input 
              type="text" 
              className={styles.chatInput}
              placeholder="Ask me anything..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" className={styles.sendBtn} disabled={chatLoading || !inputValue.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>

        {/* Right Side: Saved Workout & Subscription */}
        <div className={styles.rightColumn}>
          <div className={styles.subBox} onClick={() => navigate('/member/billing')}>
            <h3 className={styles.subTitle}>MONTHLY SUBSCRIPTION</h3>
            <p className={styles.subDesc}>Get unlimited access to Kabakal Gym, premium coaching tools, and exclusive member benefits.</p>
            <div className={styles.subStatusWrapper}>
              <div className={styles.subStatusLabel}>Status</div>
              {profile?.paymentStatus === 'Paid' && profile?.isExpired === false ? (
                <div className={styles.subDays} style={{ color: '#4caf50' }}>ACTIVE</div>
              ) : (
                <div className={styles.subDays} style={{ color: '#ff3333' }}>INACTIVE</div>
              )}
              <div className={styles.subAction}>Manage Subscription →</div>
            </div>
          </div>
        </div>

      </div>

      {/* QR CODE SCANNER MODAL */}
      <QRScannerModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />
    </div>
  );
};

export default MemberDashboardPage;
