// src/App.js
import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { HeatProvider } from './context/HeatContext';
import { PageProvider } from './context/PageContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './utils/errorBoundary';
import { installInterceptors } from './utils/interceptors';
import DebugRouteInfo from './components/DebugRouteInfo';

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
import CalendarPage from './pages/CalendarPage';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import DogDetails from './pages/DogDetails';
import Litters from './pages/litters';
import ManagePuppies from './pages/litters/ManagePuppies';

// CMS Pages
import ManagePages from './pages/pages/ManagePages';
import PageForm from './pages/pages/PageForm';
import PagePreview from './pages/pages/PagePreview';
import PublicPage from './pages/PublicPage';
import MediaLibrary from './pages/MediaLibrary';
import HomePage from './HomePage';
import NotFoundPage from './pages/errors/NotFoundPage';

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
          <PageProvider>
            <ErrorBoundary>
              <DebugRouteInfo />
              <Routes>
              {/* Public site routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/page/:slug" element={<PublicPage />} />

              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Admin Dashboard routes - protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Overview />} />
                <Route path="profile" element={<BreederProfile />} />
                <Route path="dogs" element={<ManageDogs />} />
                <Route path="dogs/add" element={<DogForm />} />
                <Route path="dogs/:id" element={<DogDetails />} />
                <Route path="dogs/:id/edit" element={<DogForm />} />
                
                <Route path="litters" element={<ManageLitters />} />
                <Route path="litters/add" element={<AddLitterPage />} />
                <Route path="litters/:id" element={<LitterDetails />} />
                <Route path="litters/edit/:id" element={<EditLitterPage />} />
                <Route path="litters/:litterId/puppies" element={<ManagePuppies />} />
                <Route path="litters/:litterId/puppies/add" element={<AddPuppy />} />
                <Route path="puppies/:id" element={<PuppyDetails />} />
                <Route path="puppies/:id/edit" element={<PuppyDetails isEdit={true} />} />
                <Route path="puppies/add" element={<AddPuppy />} />
                
                <Route path="heats" element={<ManageHeats />} />
                <Route path="heats/add" element={<AddHeat />} />
                <Route path="heats/edit/:id" element={<EditHeat />} />
                <Route path="calendar" element={<CalendarPage />} />
                
                {/* Media Library */}
                <Route path="media" element={<MediaLibrary />} />
                
                {/* CMS Pages Management */}
                <Route path="pages" element={<ManagePages />} />
                <Route path="pages/add" element={<PageForm />} />
                <Route path="pages/edit/:id" element={<PageForm />} />
                <Route path="pages/preview/:id" element={<PagePreview />} />
              </Route>
              
              {/* 404 Not Found Page */}
              <Route path="/not-found" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
          </PageProvider>
        </HeatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
