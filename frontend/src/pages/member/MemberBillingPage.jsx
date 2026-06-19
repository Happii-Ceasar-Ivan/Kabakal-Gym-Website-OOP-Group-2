import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemberBilling.module.css';

const MemberBillingPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('kabakal_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return null;

    return (
        <div className={styles.pageContainer}>
            <h3 className={styles.tabsTitle}>HERE'S YOUR TAB, {user.firstName.toUpperCase()}!</h3>

            {/* Payment Method Selection */}
            <section>
                <div className={styles.sectionText}>
                    <h4>CHOOSE PAYMENT METHOD</h4>
                </div>
                <div className={styles.paymentMethodGrid}>
                    <button className={styles.paymentBtn} type="button">GCASH</button>
                    <button className={styles.paymentBtn} type="button">QR-CODE</button>
                    <button className={styles.paymentBtn} type="button">CASH</button>
                    <button className={styles.paymentBtn} type="button">CREDIT CARD</button>
                </div>
            </section>

            {/* Invoice History */}
            <section>
                <div className={styles.sectionText}>
                    <h4>Invoice History</h4>
                </div>
                <div className={styles.invoiceHistoryContainer}>
                    <div className={styles.invoiceCard}>
                        <div className={styles.invoiceHeader}>
                            <div className={styles.invoiceDate}>MON, MAY 18, 2026</div>
                            <span className={styles.invoiceStatusBadge}>Verified</span>
                        </div>
                        
                        <div className={styles.invoiceTimes}>
                            <span>CHECK-IN: 06:00 PM</span>
                            <span>CHECK-OUT: 08:00 PM</span>
                        </div>

                        <hr className={styles.invoiceDivider} />

                        <div className={styles.invoiceDetails}>
                            <div className={styles.invoiceLabel}>PAYMENT METHOD</div>
                            <div className={styles.invoiceValue}>DAY PASS</div>
                            
                            <div className={styles.invoiceLabel}>TOTAL</div>
                            <div className={styles.invoiceValue}>₱50.00</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Promo Section */}
            <section>
                <div className={styles.promoBannerContainer}>
                    <p className={styles.promoBannerText}>TRY OUT OUR GYM MEMBERSHIP NOW!</p>
                    <button type="button" className={styles.ctaButton}>TAP TO PAY SUBSCRIPTION</button>
                </div>
            </section>
            
            {/* QR Code Section */}
            <section>
                <div className={styles.sectionText}>
                    <h4>SCAN QR-CODE TO CHECK IN</h4>
                </div>
                <div className={styles.qrCodeWrapper}>
                    <div className={styles.qrCode}>
                        {/* We use a placeholder image here for now, or real react-qr-code if installed */}
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.userId}`} alt="QR Code" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MemberBillingPage;
