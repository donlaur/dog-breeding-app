// src/components/DashboardLayout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const DashboardLayout = () => {
  return (
    <>
      <Header />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
        <nav style={{ width: '250px', padding: '20px', background: '#f4f4f4' }}>
          <h2>Breeder Dashboard</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/dashboard/profile">Manage Profile</Link></li>
            <li><Link to="/dashboard/dogs">Manage Dogs</Link></li>
            <li><Link to="/dashboard/litters">Manage Litters</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, padding: '20px' }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
};

export default DashboardLayout;
