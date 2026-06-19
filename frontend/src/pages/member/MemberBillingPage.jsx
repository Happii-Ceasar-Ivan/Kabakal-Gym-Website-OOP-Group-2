import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { processPayment } from '../../services/api';
import toast from 'react-hot-toast';

const MemberBillingPage = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isSuccess = searchParams.get('success') === 'true';

  const handleSubscribeClick = () => {
    setShowConfirm(true);
  };

  const cancelSubscribe = () => {
    setShowConfirm(false);
  };

  const confirmSubscribe = async () => {
    setLoading(true);
    try {
      const response = await processPayment();
      if (response && response.url) {
        window.location.href = response.url; // redirect to Xendit Invoice
      } else {
        toast.error("Failed to generate payment link.");
        setShowConfirm(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Payment gateway error.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      color: '#e0e0e0', 
      textAlign: 'center', 
      backgroundColor: '#030303',
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {showConfirm && !isSuccess && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#060407',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ fontFamily: "'Archive', sans-serif", color: '#fff', fontSize: '20px', marginBottom: '16px' }}>CONFIRM SUBSCRIPTION</h3>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
              You are about to subscribe to the Kabakal Gym Premium Pass for <strong>₱699/month</strong>. You will be redirected to our secure payment gateway (Xendit) to complete the transaction.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={cancelSubscribe}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                CANCEL
              </button>
              <button 
                onClick={confirmSubscribe}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f7f014',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'WAIT...' : 'PROCEED'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Archive', sans-serif", color: '#f7f014', marginBottom: '10px', fontSize: '2rem' }}>
          {isSuccess ? 'RECEIPT' : 'SUBSCRIPTION'}
        </h1>
        <p style={{ color: '#888', marginBottom: '40px', fontSize: '14px', lineHeight: '1.5' }}>
          {isSuccess 
            ? 'Thank you! Your payment was successful and your account is now premium.'
            : 'Upgrade to a premium membership to unlock all gym features, gate priority, and enhanced AI coaching limits.'}
        </p>

        {isSuccess ? (
          <div style={{
            backgroundColor: '#060407',
            border: '1px dashed #4caf50',
            borderRadius: '16px',
            padding: '40px 30px',
            textAlign: 'left'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                color: '#4caf50', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>✓</div>
              <h2 style={{ fontFamily: "'Archive', sans-serif", fontSize: '24px', color: '#fff', margin: 0 }}>PAYMENT SUCCESSFUL</h2>
            </div>
            
            <div style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '20px 0', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#888' }}>Plan</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Premium Pass (1 Month)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#888' }}>Amount Paid</span>
                <span style={{ color: '#f7f014', fontWeight: 'bold' }}>₱699.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Gateway</span>
                <span style={{ color: '#fff' }}>Xendit</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/member/dashboard')}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Archive', sans-serif",
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              BACK TO DASHBOARD
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#060407',
            border: '2px solid #f7f014',
            borderRadius: '16px',
            padding: '40px 30px',
            boxShadow: '0 0 40px rgba(247, 240, 20, 0.05)',
            textAlign: 'left'
          }}>
            <h2 style={{ fontFamily: "'Archive', sans-serif", fontSize: '24px', marginBottom: '10px', color: '#fff' }}>
              PREMIUM PASS
            </h2>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#f7f014', marginBottom: '30px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              ₱699 <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', fontSize: '14px', color: '#ccc', lineHeight: '2.5' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f7f014', fontWeight: 'bold' }}>✓</span> Unlimited access to Kabakal Gym
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f7f014', fontWeight: 'bold' }}>✓</span> Priority check-in via QR Gate Kiosk
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f7f014', fontWeight: 'bold' }}>✓</span> <strong>AI Chatbot:</strong> 15 prompts per 30 mins
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f7f014', fontWeight: 'bold' }}>✓</span> <strong>AI Workouts:</strong> 3 routines per week
              </li>
            </ul>

            <button 
              onClick={handleSubscribeClick} 
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#f7f014',
                color: '#060407',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Archive', sans-serif",
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
              onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
            >
              SUBSCRIBE NOW
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#666' }}>
              Secured and processed via Xendit gateway.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberBillingPage;
