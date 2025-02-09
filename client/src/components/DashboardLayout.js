import { Link, Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: '250px', padding: '20px', background: '#f4f4f4' }}>
        <h2>Breeder Dashboard</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="/dashboard/profile">Manage Profile</Link></li>
          <li><Link to="/dashboard/dogs">Manage Dogs</Link></li>
          <li><Link to="/dashboard/litters">Manage Litters</Link></li>
        </ul>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />  {/* ✅ This renders the dashboard pages inside the layout */}
      </main>
    </div>
  );
};

export default DashboardLayout;
