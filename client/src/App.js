// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { HeatProvider } from './context/HeatContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from "./components/DashboardLayout";
import Overview from './pages/Overview';
import BreederProfile from "./pages/BreederProfile";
import ManageDogs from "./pages/dogs/ManageDogs";
import DogForm from "./pages/dogs/DogForm";
import ManageLitters from "./pages/litters/ManageLitters";
import AddLitterPage from "./pages/litters/AddLitterPage";
import LitterDetails from "./pages/litters/LitterDetails";
import EditLitterPage from "./pages/litters/EditLitterPage";
import AddPuppy from "./pages/puppies/AddPuppy";
import ManageHeats from './pages/heats/ManageHeats';
import AddHeat from './pages/heats/AddHeat';
import EditHeat from './pages/heats/EditHeat';
import PuppyDetails from './pages/puppies/PuppyDetails';
import HeatCalendar from './components/HeatCalendar';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import DogDetails from './pages/DogDetails';
import Litters from './pages/litters';

function App() {
  return (
    <AuthProvider>
      <HeatProvider>
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
            <Route path="dogs/:id" element={<DogDetails />} />
            <Route path="dogs/:id/:name" element={<DogDetails />} />
            <Route path="dogs/add" element={<DogForm />} />
            <Route path="dogs/edit/:id" element={<DogForm />} />
            <Route path="litters" element={<ManageLitters />} />
            <Route path="litters/add" element={<AddLitterPage />} />
            <Route path="litters/:litterId" element={<LitterDetails />} />
            <Route path="litters/edit/:litterId" element={<EditLitterPage />} />
            <Route path="litters/:litterId/add-puppy" element={<AddPuppy />} />
            <Route path="litters/:litterId/puppies" element={<Navigate to="/dashboard/litters/:litterId" replace />} />
            <Route path="litters/:litterId/puppies/add" element={<AddPuppy />} />
            <Route path="heats" element={<ManageHeats />} />
            <Route path="heats/add" element={<AddHeat />} />
            <Route path="heats/edit/:heatId" element={<EditHeat />} />
            <Route path="heat-calendar" element={<HeatCalendar />} />
            <Route path="puppies/:puppyId" element={<PuppyDetails />} />
          </Route>
          
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Legacy route handling */}
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/dogs/*" element={<Navigate to="/dashboard/dogs" replace />} />
          <Route path="/litters/*" element={<Navigate to="/dashboard/litters" replace />} />
          <Route path="/heats/*" element={<Navigate to="/dashboard/heats" replace />} />
          <Route path="/heat-calendar" element={<Navigate to="/dashboard/heat-calendar" replace />} />
        </Routes>
      </HeatProvider>
    </AuthProvider>
  );
}

export default App;
