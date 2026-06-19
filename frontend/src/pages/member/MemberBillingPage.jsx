import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { processPayment, getMyProfile, forceActivate } from '../../services/api';
import toast from 'react-hot-toast';

const MemberBillingPage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

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

  const handleForceActivate = async () => {
    setLoading(true);
    try {
      const response = await forceActivate();
      toast.success(response.message || "Force activated successfully!");
      // Reload the page to refresh profile
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err.message || "Failed to force activate.");
    } finally {
      setLoading(false);
    }
  };

  const activeSub = profile?.paymentStatus === 'Paid' && profile?.isExpired === false;
  
  let diffDays = 0;
  let formattedExpDate = '';
  
  if (activeSub && profile?.expirationDate) {
      const endDate = new Date(profile.expirationDate);
      const today = new Date();
      const diffTime = endDate - today;
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formattedExpDate = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (isLoadingProfile) {
    return (
      <div style={{ padding: '40px 20px', color: '#888', textAlign: 'center', backgroundColor: '#060407', minHeight: '100vh', fontFamily: "'Fira Code', monospace" }}>
        Loading billing details...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 20px', 
      color: '#e0e0e0', 
      textAlign: 'center', 
      backgroundColor: '#060407', /* Brand background */
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: "'Fira Code', monospace" /* Brand body text */
    }}>
      {showConfirm && !isSuccess && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 4, 7, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#060407',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontFamily: "'Archive', sans-serif", color: '#fff', fontSize: '18px', marginBottom: '16px', letterSpacing: '1px' }}>CONFIRM SUBSCRIPTION</h3>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '32px', lineHeight: '1.6' }}>
              You are about to subscribe to the Kabakal Gym Premium Pass for <strong style={{ color: '#F7F014' }}>₱699/month</strong>. You will be redirected to our secure payment gateway to complete the transaction.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={cancelSubscribe}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  fontFamily: "'Archive', sans-serif",
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)'
                }}
                onMouseOver={(e) => !loading && (e.target.style.borderColor = '#666')}
                onMouseOut={(e) => !loading && (e.target.style.borderColor = '#333')}
              >
                CANCEL
              </button>
              <button 
                onClick={confirmSubscribe}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#F7F014', /* Brand Yellow */
                  color: '#060407',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: "'Archive', sans-serif",
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)'
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#fff')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#F7F014')}
              >
                {loading ? 'WAIT...' : 'PROCEED'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Archive', sans-serif", color: '#F7F014', marginBottom: '8px', fontSize: '1.8rem', letterSpacing: '2px' }}>
          {isSuccess ? 'RECEIPT' : 'SUBSCRIPTION'}
        </h1>
        <p style={{ color: '#888', marginBottom: '40px', fontSize: '13px', lineHeight: '1.6' }}>
          {isSuccess 
            ? 'Thank you! Your payment was successful and your account is now premium.'
            : 'Upgrade to a premium membership to unlock all gym features, gate priority, and enhanced AI coaching limits.'}
        </p>

        {isSuccess ? (
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'left'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                color: '#4caf50', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>✓</div>
              <h2 style={{ fontFamily: "'Archive', sans-serif", fontSize: '18px', color: '#fff', margin: 0, letterSpacing: '1px' }}>PAYMENT SUCCESSFUL</h2>
            </div>
            
            <div style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '24px 0', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Plan</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>Premium Pass (1 Month)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Amount Paid</span>
                <span style={{ color: '#F7F014', fontWeight: 'bold', fontSize: '13px' }}>₱699.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Gateway</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>Xendit</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/member/dashboard')}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px',
                fontFamily: "'Archive', sans-serif",
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)'
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#333'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = '#1a1a1a'; }}
            >
              BACK TO DASHBOARD
            </button>
          </div>
        ) : activeSub ? (
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontFamily: "'Archive', sans-serif", fontSize: '18px', marginBottom: '24px', color: '#fff', letterSpacing: '1px' }}>
              ACTIVE MEMBERSHIP
            </h2>
            
            <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '6px', marginBottom: '24px', borderLeft: '4px solid #F7F014' }}>
               <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: "'Archive', sans-serif" }}>Remaining Days</div>
               <div style={{ fontSize: '36px', color: '#fff', fontWeight: 'bold', fontFamily: "'Archive', sans-serif" }}>
                 {diffDays} <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}>DAYS</span>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a1a', paddingTop: '24px' }}>
                <div>
                    <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontFamily: "'Archive', sans-serif" }}>Next Billing Date</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{formattedExpDate}</div>
                </div>
                <button 
                  onClick={handleSubscribeClick} 
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#F7F014',
                    border: '1px solid #F7F014',
                    borderRadius: '4px',
                    fontFamily: "'Archive', sans-serif",
                    fontSize: '11px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.backgroundColor = 'rgba(247, 240, 20, 0.1)')}
                  onMouseOut={(e) => !loading && (e.target.style.backgroundColor = 'transparent')}
                >
                  RENEW NOW
                </button>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '8px',
            padding: '40px 32px',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontFamily: "'Archive', sans-serif", fontSize: '18px', marginBottom: '8px', color: '#fff', letterSpacing: '1px' }}>
              PREMIUM PASS
            </h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F7F014', marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '8px', fontFamily: "'Archive', sans-serif" }}>
              ₱699 <span style={{ fontSize: '13px', color: '#888', fontWeight: 'normal', fontFamily: "'Fira Code', monospace" }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', fontSize: '13px', color: '#999', lineHeight: '2' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ color: '#F7F014', fontSize: '16px' }}>✦</span> Unlimited access to Kabakal Gym
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ color: '#F7F014', fontSize: '16px' }}>✦</span> Priority check-in via QR Gate Kiosk
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ color: '#F7F014', fontSize: '16px' }}>✦</span> <strong style={{color: '#fff'}}>AI Chatbot:</strong> 15 prompts per 30 mins
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#F7F014', fontSize: '16px' }}>✦</span> <strong style={{color: '#fff'}}>AI Workouts:</strong> 3 routines per week
              </li>
            </ul>

            <button 
              onClick={handleSubscribeClick} 
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#F7F014',
                color: '#060407',
                border: 'none',
                borderRadius: '4px',
                fontFamily: "'Archive', sans-serif",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1), background-color 250ms cubic-bezier(0.32, 0.72, 0, 1)'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#fff')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#F7F014')}
              onMouseDown={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !loading && (e.target.style.transform = 'scale(1)')}
            >
              {loading ? 'PROCESSING...' : 'SUBSCRIBE NOW'}
            </button>

            <button 
              onClick={handleForceActivate} 
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                backgroundColor: 'transparent',
                color: '#888',
                border: '1px dashed #333',
                borderRadius: '4px',
                fontFamily: "'Archive', sans-serif",
                fontSize: '11px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)'
              }}
              onMouseOver={(e) => !loading && (e.target.style.color = '#fff')}
              onMouseOut={(e) => !loading && (e.target.style.color = '#888')}
            >
              FORCE ACTIVATE (DEV BYPASS)
            </button>

            <div style={{ marginTop: '24px', fontSize: '10px', color: '#555', textAlign: 'center', letterSpacing: '1px' }}>
              SECURED AND PROCESSED VIA XENDIT GATEWAY
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberBillingPage;
