import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './HomePage';
import PuppiesPage from './PuppiesPage';
import PuppyDetails from './PuppyDetails';
import ContactPage from './pages/ContactPage';
import DashboardMessages from './pages/DashboardMessages';

// ✅ Import Breeder Management Pages
import DashboardLayout from './components/DashboardLayout';
import BreederPrograms from './pages/dashboard/BreederPrograms';
import Dogs from './pages/dashboard/Dogs';
import Litters from './pages/dashboard/Litters';

function App() {
  return (
    <>
      <Header />
      <div className="container mt-4">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/puppies" element={<PuppiesPage />} />
          <Route path="/puppy/:id" element={<PuppyDetails />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard/messages" element={<DashboardMessages />} />

          {/* ✅ Breeder Dashboard Layout */}
          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route path="programs" element={<BreederPrograms />} />
            <Route path="dogs" element={<Dogs />} />
            <Route path="litters" element={<Litters />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
