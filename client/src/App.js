// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { HeatProvider } from './context/HeatContext';
import { DogProvider } from './context/DogContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from "./components/DashboardLayout";
import BreederProfile from "./pages/BreederProfile";
import ManageDogs from "./pages/dogs/ManageDogs";
import DogForm from "./pages/dogs/DogForm";
import ManageLitters from "./pages/litters/ManageLitters";
import AddLitterPage from "./pages/litters/AddLitterPage";
import LitterDetails from "./pages/litters/LitterDetails";
import EditLitterPage from "./pages/litters/EditLitterPage";
import AddPuppy from "./pages/litters/AddPuppy";
import ManageHeats from './pages/heats/ManageHeats';
import AddHeat from './pages/heats/AddHeat';
import EditHeat from './pages/heats/EditHeat';
import PuppyDetails from './pages/puppies/PuppyDetails';
import HeatCalendar from './components/HeatCalendar';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';

function App() {
  return (
    <AuthProvider>
      <DogProvider>
        <HeatProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<BreederProfile />} />
              <Route path="profile" element={<BreederProfile />} />
              <Route path="dogs" element={<ManageDogs />} />
              <Route path="dogs/add" element={<DogForm />} />
              <Route path="dogs/edit/:id" element={<DogForm />} />
              <Route path="litters" element={<ManageLitters />} />
              <Route path="litters/add" element={<AddLitterPage />} />
              <Route path="litters/:litterId" element={<LitterDetails />} />
              <Route path="litters/edit/:litterId" element={<EditLitterPage />} />
              <Route path="litters/:litterId/add-puppy" element={<AddPuppy />} />
              <Route path="heats" element={<ManageHeats />} />
              <Route path="heats/add" element={<AddHeat />} />
              <Route path="heats/edit/:heatId" element={<EditHeat />} />
              <Route path="heats/calendar" element={<HeatCalendar />} />
              <Route path="puppies/:puppyId" element={<PuppyDetails />} />
            </Route>
            
            {/* Redirect root to dashboard or login */}
            <Route path="/" element={
              <Navigate to="/dashboard" replace />
            } />
          </Routes>
        </HeatProvider>
      </DogProvider>
    </AuthProvider>
  );
}

export default App;
