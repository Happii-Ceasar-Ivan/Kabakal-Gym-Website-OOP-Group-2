import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { getDashboardAnalytics } from '../../services/api';
import adminStyles from './Admin.module.css';
import styles from './AdminDashboard.module.css';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      // Fetch current month's data
      const response = await getDashboardAnalytics(now.getFullYear(), now.getMonth() + 1);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={adminStyles.mainContent}>
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>CRUNCHING NUMBERS...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={adminStyles.mainContent}>
        <div className={adminStyles.pageHeader}>
          <h1 className={adminStyles.pageTitle}>Dashboard</h1>
        </div>
        <p style={{ color: '#ff4444' }}>{error}</p>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Prepare Chart Data
  const dailyRevenueData = data.dailyRevenue.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue
  }));

  const peakUsageData = data.peakUsageHours.map(d => ({
    hour: `${d.hourOfDay}:00`,
    visits: d.visitCount
  }));

  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={styles.tooltipData} style={{ color: entry.color }}>
              {formatter ? formatter(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={adminStyles.mainContent}>
      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>Business Analytics</h1>
        <p style={{color: '#888'}}>Live overview of gym performance</p>
      </div>

      <motion.div 
        className={styles.dashboardContainer}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Metric Cards */}
        <div className={styles.metricsGrid}>
          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Total Revenue</div>
            <div className={styles.metricValue}>₱{data.totalRevenue.toLocaleString()}</div>
            <div className={styles.metricSubtext}>Current Month</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Active Members</div>
            <div className={styles.metricValue}>{data.activeMembersCount}</div>
            <div className={styles.metricSubtext}>Currently Subscribed</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Total Equipment</div>
            <div className={styles.metricValue}>{data.totalEquipmentCount}</div>
            <div className={styles.metricSubtext}>Across all categories</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Peak Hour</div>
            <div className={styles.metricValue}>
              {data.peakUsageHours.length > 0 ? `${data.peakUsageHours[0].hourOfDay}:00` : 'N/A'}
            </div>
            <div className={styles.metricSubtext}>Most crowded time</div>
          </motion.div>
        </div>

        {/* Charts Area */}
        <div className={styles.chartsContainer}>
          
          <motion.div className={styles.chartCard} variants={itemVariants}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Daily Revenue Trend</h2>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-heading)' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-heading)' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <RechartsTooltip content={<CustomTooltip formatter={(val) => `₱${val.toLocaleString()}`} />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--accent-yellow)" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1a1a1a', stroke: 'var(--accent-yellow)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'var(--accent-yellow)' }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className={styles.chartCard} variants={itemVariants}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Peak Usage Hours</h2>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#888" 
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-heading)' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#888" 
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-heading)' }} 
                    axisLine={false} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip formatter={(val) => `${val} visits`} />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar 
                    dataKey="visits" 
                    fill="var(--accent-yellow)" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={2000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;
