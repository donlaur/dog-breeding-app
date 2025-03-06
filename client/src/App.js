// src/App.js
import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { HeatProvider } from './context/HeatContext';
import { PageProvider } from './context/PageContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './utils/errorBoundary';
import { installInterceptors } from './utils/interceptors';
import DebugRouteInfo from './components/DebugRouteInfo';

// Always imported (critical components)
import HomePage from './HomePage';
import NotFoundPage from './pages/errors/NotFoundPage';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import PublicPage from './pages/PublicPage';

// Lazy loaded components
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
    <CircularProgress />
  </Box>
);

// Public Pages
const DogDetailPage = lazy(() => import('./pages/dogs/DogDetailPage'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

// Dashboard Pages
const Overview = lazy(() => import('./pages/Overview'));
const BreederProfile = lazy(() => import('./pages/BreederProfile'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));

// Dog Management
const ManageDogs = lazy(() => import('./pages/dogs/ManageDogs'));
const DogDetails = lazy(() => import('./pages/DogDetails'));
const DogForm = lazy(() => import('./pages/dogs/DogForm'));

// Litter Management
const Litters = lazy(() => import('./pages/litters'));
const ManageLitters = lazy(() => import('./pages/litters/ManageLitters'));
const AddLitterPage = lazy(() => import('./pages/litters/AddLitterPage'));
const LitterDetails = lazy(() => import('./pages/litters/LitterDetails'));
const EditLitterPage = lazy(() => import('./pages/litters/EditLitterPage'));
const ManagePuppies = lazy(() => import('./pages/litters/ManagePuppies'));

// Puppy Management
const AddPuppy = lazy(() => import('./pages/puppies/AddPuppy'));
const PuppyDetails = lazy(() => import('./pages/puppies/PuppyDetails'));

// Heat Management
const ManageHeats = lazy(() => import('./pages/heats/ManageHeats'));
const AddHeat = lazy(() => import('./pages/heats/AddHeat'));
const EditHeat = lazy(() => import('./pages/heats/EditHeat'));

// CMS Pages
const ManagePages = lazy(() => import('./pages/pages/ManagePages'));
const PageForm = lazy(() => import('./pages/pages/PageForm'));
const PagePreview = lazy(() => import('./pages/pages/PagePreview'));

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
              <Route path="/dog/:gender/:slug/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DogDetailPage />
                </Suspense>
              } />
              {/* Keep the old route for backward compatibility */}
              <Route path="/dog/:slug/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DogDetailPage />
                </Suspense>
              } />

              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Admin Dashboard routes - protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Overview />
                  </Suspense>
                } />
                <Route path="profile" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <BreederProfile />
                  </Suspense>
                } />
                
                {/* Dog Management Routes */}
                <Route path="dogs" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ManageDogs />
                  </Suspense>
                } />
                <Route path="dogs/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <DogForm />
                  </Suspense>
                } />
                <Route path="dogs/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <DogDetails />
                  </Suspense>
                } />
                <Route path="dogs/:id/edit" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <DogForm />
                  </Suspense>
                } />
                
                {/* Litter Management Routes */}
                <Route path="litters" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ManageLitters />
                  </Suspense>
                } />
                <Route path="litters/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AddLitterPage />
                  </Suspense>
                } />
                <Route path="litters/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LitterDetails />
                  </Suspense>
                } />
                <Route path="litters/edit/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EditLitterPage />
                  </Suspense>
                } />
                <Route path="litters/:litterId/puppies" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ManagePuppies />
                  </Suspense>
                } />
                <Route path="litters/:litterId/puppies/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AddPuppy />
                  </Suspense>
                } />
                
                {/* Puppy Management Routes */}
                <Route path="puppies/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PuppyDetails />
                  </Suspense>
                } />
                <Route path="puppies/:id/edit" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PuppyDetails isEdit={true} />
                  </Suspense>
                } />
                <Route path="puppies/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AddPuppy />
                  </Suspense>
                } />
                
                {/* Heat Management Routes */}
                <Route path="heats" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ManageHeats />
                  </Suspense>
                } />
                <Route path="heats/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AddHeat />
                  </Suspense>
                } />
                <Route path="heats/edit/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EditHeat />
                  </Suspense>
                } />
                <Route path="calendar" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CalendarPage />
                  </Suspense>
                } />
                
                {/* Media Library */}
                <Route path="media" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MediaLibrary />
                  </Suspense>
                } />
                
                {/* CMS Pages Management */}
                <Route path="pages" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ManagePages />
                  </Suspense>
                } />
                <Route path="pages/add" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PageForm />
                  </Suspense>
                } />
                <Route path="pages/edit/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PageForm />
                  </Suspense>
                } />
                <Route path="pages/preview/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PagePreview />
                  </Suspense>
                } />
                
                {/* Search Results */}
                <Route path="search" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <SearchResultsPage />
                  </Suspense>
                } />
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
