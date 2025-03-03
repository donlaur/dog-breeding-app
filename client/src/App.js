// src/App.js
import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { HeatProvider } from './context/HeatContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './utils/errorBoundary';
import { installInterceptors } from './utils/interceptors';

// Pages
import Overview from './pages/Overview';
import BreederProfile from './pages/BreederProfile';
import ManageDogs from './pages/dogs/ManageDogs';
import DogForm from './pages/dogs/DogForm';
import ManageLitters from './pages/litters/ManageLitters';
import AddLitterPage from './pages/litters/AddLitterPage';
import LitterDetails from './pages/litters/LitterDetails';
import EditLitterPage from './pages/litters/EditLitterPage';
import AddPuppy from './pages/puppies/AddPuppy';
import ManageHeats from './pages/heats/ManageHeats';
import AddHeat from './pages/heats/AddHeat';
import EditHeat from './pages/heats/EditHeat';
import PuppyDetails from './pages/puppies/PuppyDetails';
import HeatCalendar from './components/heats/HeatCalendar';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import DogDetails from './pages/DogDetails';
import Litters from './pages/litters';
import ManagePuppies from './pages/litters/ManagePuppies';

function App() {
  // Use a ref to track if interceptors are installed
  const interceptorsInstalledRef = useRef(false);
  
  // Install interceptors just once
  useEffect(() => {
    // Only install if not already installed
    if (!interceptorsInstalledRef.current) {
      console.log('Installing API interceptors...');
      const cleanup = installInterceptors();
      interceptorsInstalledRef.current = true;
      
      // Clean up interceptors when app unmounts
      return () => {
        console.log('Cleaning up API interceptors...');
        cleanup();
        interceptorsInstalledRef.current = false;
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HeatProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Dashboard routes with layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Overview />} />
                <Route path="profile" element={<BreederProfile />} />
                <Route path="dogs" element={<ManageDogs />} />
                <Route path="dogs/add" element={<DogForm />} />
                <Route path="dogs/edit/:id" element={<DogForm />} />
                <Route path="dogs/:id" element={<DogDetails />} />
                
                {/* Litter Routes */}
                <Route path="litters/new" element={<EditLitterPage />} />
                <Route path="litters/edit/:id" element={<EditLitterPage />} />
                <Route path="litters/:id" element={<LitterDetails />} />
                <Route path="litters" element={<ManageLitters />} />
                <Route path="litters/add" element={<AddLitterPage />} />
                <Route path="litters/:id/puppies" element={<ManagePuppies />} />
                <Route path="litters/:id/puppies/add" element={<AddPuppy />} />
                <Route path="puppies/:id" element={<PuppyDetails />} />
                
                <Route path="heats" element={<ManageHeats />} />
                <Route path="heats/add" element={<AddHeat />} />
                <Route path="heats/edit/:id" element={<EditHeat />} />
                <Route path="heats/calendar" element={<HeatCalendar />} />
              </Route>
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Overview />} />
            </Routes>
          </ErrorBoundary>
        </HeatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
