import React from 'react';
import { useNavigate } from 'react-router-dom';

const MemberDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', color: '#f7f014', textAlign: 'center' }}>
      <h1 style={{ fontFamily: "'Archive', sans-serif", marginTop: '40px' }}>WELCOME, MEMBER!</h1>
      <p style={{ marginTop: '20px', marginBottom: '40px' }}>Dashboard Under Construction (Hybrid Merge)</p>
      
      <button 
        onClick={() => navigate('/member/chat')}
        style={{
          background: 'transparent',
          border: '2px solid #f7f014',
          color: '#f7f014',
          padding: '16px 32px',
          borderRadius: '999px',
          fontFamily: "'Archive', sans-serif",
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: 'inset 0 -2px 0 rgba(0, 0, 0, 0.15), 0 0 8px rgba(247, 240, 20, 0.4)',
          textTransform: 'uppercase',
          width: '100%',
          maxWidth: '300px'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#f7f014';
          e.target.style.color = '#060407';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#f7f014';
        }}
      >
        Chat with KG Coach
      </button>
    </div>
  );
};

export default MemberDashboardPage;
