import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import SkeletonLoader from '../components/SkeletonLoader';
import { wakeupServer, getEquipment, BASE_URL } from '../services/api';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    // Silently pre-warm the Azure backend
    wakeupServer();

    // Fetch equipment
    const fetchEq = async () => {
      try {
        const data = await getEquipment(1, 50, ''); // Fetch up to 50
        // Group active equipment by name to avoid visual duplicates (e.g., Press Machine x2)
        const activeItems = data.items.filter(e => e.isActive);
        const grouped = activeItems.reduce((acc, curr) => {
          const existing = acc.find(item => item.equipmentName === curr.equipmentName);
          if (existing) {
            existing.count = (existing.count || 1) + 1;
          } else {
            acc.push({ ...curr, count: 1 });
          }
          return acc;
        }, []);
        setEquipmentItems(grouped);
      } catch (err) {
        console.error("Failed to load equipment:", err);
      }
    };

    const minDelay = new Promise((r) => setTimeout(r, 1200));
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    Promise.all([fetchEq(), minDelay, fontsReady]).then(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Background Honeycomb Overlay */}
      <div className={styles.hexOverlay}></div>

      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="/monogram-logo.png" alt="Kabakal Gym" className={styles.navLogo} />
          <span className={styles.brandName}>Kabakal Gym</span>
        </div>
        <nav className={styles.navLinks}>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className={styles.installBtn}>
              📱 Install App
            </button>
          )}
          <a href="#about" className={styles.navLink}>About</a>
          <a href="#equipment" className={styles.navLink}>Equipment</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
        </nav>
        <Link to="/login" className={styles.loginBtn}>
          Member Login
        </Link>
      </header>

      {/* --- HERO SECTION --- */}
      <section id="about" className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeading}>Kabakal, <span className={styles.highlight}>Always a Kabakal.</span></h1>
          <p className={styles.heroText}>
            Kabakal Gym is your affordable, no-nonsense iron paradise. We stripped away the
            expensive fluff to bring you pure, heavy lifting and a community built on real gains.
          </p>

          <div className={styles.contactInfo}>
            <div className={styles.contactRow}>
              <span className={styles.icon}>📍</span>
              <span>47 Kalayaan B, Batasan Hills, Quezon City</span>
            </div>
            <div className={styles.contactRow}>
              <span className={styles.icon}>📞</span>
              <span>0917 123 4567</span>
            </div>
            <div className={styles.contactRow}>
              <span className={styles.icon}>⏰</span>
              <span>Open Daily: 6:00 AM - 10:00 PM</span>
            </div>
          </div>
        </div>

        <div className={styles.heroImageContainer}>
          <img
            src="https://i.imgur.com/HX3M0j0.jpeg"
            alt="Kabakal Gym Interior"
            className={styles.heroImage}
          />
        </div>
      </section>

      {/* --- IRON ARSENAL SECTION (Carousel) --- */}
      <section id="equipment" className={styles.arsenalSection}>
        <h2 className={styles.sectionHeading}>Our Iron Arsenal</h2>
        <div className={styles.carouselWrapper}>
          <div className={styles.carouselTrack}>
            {equipmentItems.length === 0 ? (
               <div style={{ color: '#888', padding: '2rem' }}>Loading equipment...</div>
            ) : (
               [...equipmentItems, ...equipmentItems].map((item, idx) => (
                 <div key={idx} className={styles.arsenalCard}>
                   {item.imageUrl ? (
                     <div 
                       className={styles.arsenalImageBg} 
                       style={{ backgroundImage: `url(${BASE_URL}${item.imageUrl})` }}
                     >
                       <div className={styles.arsenalCardContentOverlay}>
                         <span className={styles.arsenalName}>
                           {item.equipmentName} {item.count > 1 && <span style={{color: 'var(--accent-yellow)', marginLeft: '4px'}}>x{item.count}</span>}
                         </span>
                         <span className={styles.arsenalDesc}>{item.equipmentStatus}</span>
                       </div>
                     </div>
                   ) : (
                     <div className={styles.arsenalPlaceholder}>
                       <div className={styles.arsenalCardContent}>
                         <span className={styles.arsenalName}>
                           {item.equipmentName} {item.count > 1 && <span style={{color: 'var(--accent-yellow)', marginLeft: '4px'}}>x{item.count}</span>}
                         </span>
                         <span className={styles.arsenalDesc}>{item.equipmentStatus}</span>
                       </div>
                     </div>
                   )}
                 </div>
               ))
            )}
          </div>
        </div>
      </section>

      {/* --- MEMBERSHIP PLANS SECTION --- */}
      <section id="pricing" className={styles.pricingSection}>
        <h2 className={styles.sectionHeading}>Membership Plans</h2>

        <div className={styles.pricingGrid}>
          {/* Day Pass */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Day Pass</h3>
            <div className={styles.planPrice}>₱50</div>
            <ul className={styles.planFeatures}>
              <li><span className={styles.check}>✓</span> Single Entry Access</li>
              <li><span className={styles.check}>✓</span> Standard Locker Use</li>
            </ul>
            <Link to="/register" className={styles.planBtnOutline}>Get Started</Link>
          </div>

          {/* Monthly Pass (Highlighted) */}
          <div className={`${styles.pricingCard} ${styles.bestValue}`}>
            <div className={styles.badge}>BEST VALUE</div>
            <h3 className={styles.planName}>Monthly Pass</h3>
            <div className={styles.planPrice}>₱699</div>
            <ul className={styles.planFeatures}>
              <li><span className={styles.check}>✓</span> 30 Days Unlimited Access</li>
              <li><span className={styles.check}>✓</span> Automated Workout Generator</li>
              <li><span className={styles.check}>✓</span> Business Analytics Portal</li>
            </ul>
            <Link to="/register" className={styles.planBtnFilled}>Subscribe Now</Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={styles.footer}>
        <p>Kabakal Gym &copy; 2026 Digitalizing Local Fitness</p>
      </footer>

    </div>
  );
}
