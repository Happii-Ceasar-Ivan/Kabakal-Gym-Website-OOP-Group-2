import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from '../pages/admin/Admin.module.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('kabakal_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    // Check if role is Admin. The claim key might be the standard XML schema URL or simply "role".
    const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    
    if (role !== 'Admin') {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('kabakal_token');
    navigate('/login');
  };

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Admin Panel</h2>
          <p className={styles.sidebarSubtitle}>Kabakal Gym</p>
        </div>
        
        <nav className={styles.nav}>
          <Link to="/admin/members" className={styles.navLink}>
            👥 Member Management
          </Link>
          <Link to="/admin/equipment" className={styles.navLink}>
            🏋️ Equipment Management
          </Link>
        </nav>

        <div className={styles.logoutSection}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
