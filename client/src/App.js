import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './HomePage';
import PuppiesPage from './PuppiesPage';
import PuppyDetails from './PuppyDetails';
import ContactPage from './pages/ContactPage';

// ✅ Import Global State Provider
import { DogProvider } from './context/DogContext';

// ✅ Import Dashboard Layout
import DashboardLayout from './components/DashboardLayout';
import BreederProfile from './pages/dashboard/BreederProfile';
import Dogs from './pages/dashboard/Dogs';
import Litters from './pages/dashboard/Litters';
import AddLitterPage from './pages/dashboard/AddLitterPage';
import DogForm from './pages/dashboard/DogForm';

function App() {
  return (
    <DogProvider>
      <Header />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/puppies" element={<PuppiesPage />} />
          <Route path="/puppy/:id" element={<PuppyDetails />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route path="profile" element={<BreederProfile />} />
            <Route path="dogs" element={<Dogs />} />
            <Route path="litters" element={<Litters />} />
            <Route path="dogs/add" element={<DogForm />} />
            <Route path="litters/add" element={<AddLitterPage />} />
            <Route path="dogs/edit/:id" element={<DogForm />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </DogProvider>
  );
}

export default App;
