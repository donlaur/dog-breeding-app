import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MedicalServices, Vaccines, Medication, HealthAndSafety } from '@mui/icons-material';

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
              to="/dogs"
              className={`block p-2 rounded ${isActive('/dogs') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Dogs
            </Link>
            <Link
              to="/litters"
              className={`block p-2 rounded ${isActive('/litters') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Litters
            </Link>
            <Link
              to="/heats"
              className={`block p-2 rounded ${isActive('/heats') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Manage Heats
            </Link>
            <Link
              to="/heat-calendar"
              className={`block p-2 rounded ${isActive('/calendar') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              Heat Calendar
            </Link>
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">Health Management</h3>
          <div className="space-y-1">
            <Link
              to="/dashboard/health"
              className={`block p-2 rounded ${
                isActive('/dashboard/health') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MedicalServices className="w-5 h-5" />
                <span>Health Dashboard</span>
              </div>
            </Link>
            <Link
              to="/dashboard/health/vaccinations"
              className={`block p-2 rounded ${
                isActive('/dashboard/health/vaccinations') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Vaccines className="w-5 h-5" />
                <span>Manage Vaccinations</span>
              </div>
            </Link>
            <Link
              to="/dashboard/health/medications"
              className={`block p-2 rounded ${
                isActive('/dashboard/health/medications') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Medication className="w-5 h-5" />
                <span>Manage Medications</span>
              </div>
            </Link>
            <Link
              to="/dashboard/health/records"
              className={`block p-2 rounded ${
                isActive('/dashboard/health/records') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HealthAndSafety className="w-5 h-5" />
                <span>Manage Health Records</span>
              </div>
            </Link>
          </div>
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
            to="/profile"
            className={`block p-2 rounded ${isActive('/profile') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
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