import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Helper to determine if link is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-gray-100 w-64 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-8">Breeder Dashboard</h2>
      
      <nav className="space-y-4">
        <Link
          to="/dashboard"
          className={`block p-2 rounded ${
            isActive('/dashboard') 
              ? 'bg-blue-100 text-blue-700 font-medium' 
              : 'hover:bg-gray-200'
          }`}
        >
          Overview
        </Link>
        
        <div className="pt-4">
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">Program Management</h3>
          <div className="space-y-1">
            <Link
              to="/dashboard/dogs"
              className={`block p-2 rounded ${isActive('/dashboard/dogs') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Dogs
            </Link>
            <Link
              to="/dashboard/litters"
              className={`block p-2 rounded ${isActive('/dashboard/litters') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Litters
            </Link>
            <Link
              to="/dashboard/heats"
              className={`block p-2 rounded ${isActive('/dashboard/heats') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Heats
            </Link>
            <Link
              to="/dashboard/calendar"
              className={`block p-2 rounded ${isActive('/dashboard/calendar') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              onClick={(e) => {
                // Prevent default behavior and handle navigation manually
                e.preventDefault();
                console.log('Calendar link clicked, navigating to /dashboard/calendar');
                // Use navigate from useNavigate hook
                navigate('/dashboard/calendar');
              }}
            >
              Events
            </Link>
            <Link
              to="/dashboard/media"
              className={`block p-2 rounded ${isActive('/dashboard/media') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Media Library
            </Link>
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">Website</h3>
          <Link
            to="/dashboard/pages"
            className={`block p-2 rounded ${isActive('/dashboard/pages') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          >
            Manage Pages
          </Link>
        </div>
        
        <div className="pt-4">
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">Applications</h3>
          <div className="space-y-1">
            <Link
              to="/dashboard/applications"
              className={`block p-2 rounded ${isActive('/dashboard/applications') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Forms
            </Link>
            <Link
              to="/dashboard/applications/submissions"
              className={`block p-2 rounded ${isActive('/dashboard/applications/submissions') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              View Submissions
            </Link>
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">Settings</h3>
          <Link
            to="/dashboard/profile"
            className={`block p-2 rounded ${isActive('/dashboard/profile') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          >
            Breeder Profile
          </Link>
        </div>
        
        <div className="pt-6 mt-4 border-t">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-200 text-red-600"
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar; 