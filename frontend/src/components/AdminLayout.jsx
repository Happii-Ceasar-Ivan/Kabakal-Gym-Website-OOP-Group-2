import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

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
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-orange-500">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">Kabakal Gym</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link 
            to="/admin/members" 
            className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            👥 Member Management
          </Link>
          <Link 
            to="/admin/equipment" 
            className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏋️ Equipment Management
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
