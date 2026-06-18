import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { getDashboardAnalytics, getHistoricalRevenue, exportAndArchiveData } from '../../services/api';
import adminStyles from './Admin.module.css';
import styles from './AdminDashboard.module.css';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Picker State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      
      const [dashboardRes, historyRes] = await Promise.all([
        getDashboardAnalytics(parseInt(year), parseInt(month)),
        getHistoricalRevenue(6)
      ]);

      setData(dashboardRes);
      setHistoricalData(historyRes);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAndArchive = async () => {
    if (!window.confirm('WARNING: This will permanently delete records older than 3 months from the database. Ensure you save the downloaded CSV file safely. Proceed?')) {
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading('Exporting and deleting old records...');
    try {
      await exportAndArchiveData(3);
      toast.success('Archive complete. Records downloaded and deleted.', { id: loadingToast });
      fetchData(); // Refresh to reflect new database state
    } catch (err) {
      toast.error('Failed to export and archive data.', { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !data) {
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
  const dailyRevenueData = (data?.dailyRevenue || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue
  }));

  const peakUsageData = (data?.peakUsageHours || []).map(d => ({
    hour: `${d.hourOfDay}:00`,
    visits: d.visitCount
  }));

  const historyChartData = historicalData.map(h => ({
    month: h.monthName,
    revenue: h.revenue
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
      <div className={styles.topBar}>
        <div className={adminStyles.pageHeader} style={{ marginBottom: 0 }}>
          <h1 className={adminStyles.pageTitle}>Business Analytics</h1>
          <p style={{color: '#888'}}>Live overview of gym performance</p>
        </div>

        <div className={styles.datePickerWrapper}>
          <label className={styles.dateLabel}>Select Month:</label>
          <input 
            type="month" 
            className={styles.monthInput}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button 
            className={styles.archiveBtn} 
            onClick={handleExportAndArchive}
            disabled={isExporting}
          >
            {isExporting ? 'Processing...' : '📥 Export & Delete 3-Month Data'}
          </button>
        </div>
      </div>

      <motion.div 
        className={styles.dashboardContainer}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ marginTop: '2rem' }}
      >
        {/* Metric Cards */}
        <div className={styles.metricsGrid}>
          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Total Revenue</div>
            <div className={styles.metricValue}>₱{(data?.totalRevenue || 0).toLocaleString()}</div>
            <div className={styles.metricSubtext}>Selected Month</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Active Members</div>
            <div className={styles.metricValue}>{data?.activeMembersCount || 0}</div>
            <div className={styles.metricSubtext}>Currently Subscribed</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Day Pass Walk-ins</div>
            <div className={styles.metricValue}>{data?.totalWalkIns || 0}</div>
            <div className={styles.metricSubtext}>₱50 Cash Entries</div>
          </motion.div>

          <motion.div className={styles.metricCard} variants={itemVariants}>
            <div className={styles.metricTitle}>Peak Hour</div>
            <div className={styles.metricValue}>
              {(data?.peakUsageHours && data.peakUsageHours.length > 0) 
                ? `${[...data.peakUsageHours].sort((a,b) => b.visitCount - a.visitCount)[0].hourOfDay}:00` 
                : 'N/A'}
            </div>
            <div className={styles.metricSubtext}>Most crowded time</div>
          </motion.div>
        </div>

        {/* Charts Area */}
        <div className={styles.chartsContainer}>
          
          <motion.div className={styles.chartCard} variants={itemVariants}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Month-by-Month Revenue Comparison</h2>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
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
                    stroke="#44ff44" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1a1a1a', stroke: '#44ff44', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#44ff44' }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className={styles.chartCard} variants={itemVariants}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Peak Usage Hours (Selected Month)</h2>
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

        {/* Data Table */}
        <motion.div className={styles.tableContainer} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Daily Revenue Breakdown ({selectedMonth})</h2>
          </div>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {dailyRevenueData.length > 0 ? (
                dailyRevenueData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.date}</td>
                    <td style={{ color: row.revenue > 0 ? '#44ff44' : '#ddd' }}>
                      ₱{row.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>No data available for this month</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;
