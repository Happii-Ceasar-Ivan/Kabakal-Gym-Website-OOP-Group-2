import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from '../../services/api';
import styles from './MemberChat.module.css';

const MemberChatPage = () => {
  const navigate = useNavigate();
  // Start fully blank as requested
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');
    setError(null);

    // Add user message to UI
    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText);
      // Backend returns { id, message, role, timestamp } from ChatResponseDto
      setMessages([...newMessages, { sender: 'ai', text: response.message }]);
    } catch (err) {
      console.error("Chat error:", err);
      // Check if it's a rate limit error or general error
      const errorMessage = err.message || "Failed to get a response from KG Coach.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h1 className={styles.headerTitle}>KG Coach</h1>
        <button 
          onClick={() => navigate('/member/workout-generator')}
          className={styles.generateWorkoutBtn}
        >
          Generate me a workout
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.messagesContainer}>
        {messages.length === 0 && !loading && !error && (
          <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>
            <p>Start a conversation with KG Coach!</p>
            <p style={{ fontSize: '12px' }}>Ask for fitness advice, nutrition tips, or daily motivation.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.user : styles.ai}`}>
            <div className={styles.messageBubble}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className={styles.typingIndicator}>KG Coach is thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input 
          type="text" 
          className={styles.chatInput}
          placeholder="Ask me anything..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className={styles.sendBtn} disabled={loading || !inputValue.trim()}>
          {/* Simple SVG send icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MemberChatPage;
