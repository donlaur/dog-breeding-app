// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import BreederProfile from "./pages/BreederProfile";
import ManageDogs from "./pages/dogs/ManageDogs";
import DogForm from "./pages/dogs/DogForm";
import ManageLitters from "./pages/litters/ManageLitters";
import AddLitterPage from "./pages/litters/AddLitterPage";
import LitterDetails from "./pages/litters/LitterDetails";
import EditLitterPage from "./pages/litters/EditLitterPage";
import AddPuppy from "./pages/litters/AddPuppy";

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route path="profile" element={<BreederProfile />} />
        <Route path="dogs" element={<ManageDogs />} />
        <Route path="dogs/add" element={<DogForm />} />
        <Route path="dogs/edit/:id" element={<DogForm />} />
        <Route path="litters" element={<ManageLitters />} />
        <Route path="litters/add" element={<AddLitterPage />} />
        <Route path="litters/edit/:litterId" element={<EditLitterPage />} />
        <Route path="litters/:litterId" element={<LitterDetails />} />
        <Route path="litters/:litterId/add-puppy" element={<AddPuppy />} />
      </Route>
    </Routes>
  );
}

export default App;
