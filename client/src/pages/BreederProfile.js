// src/pages/BreederProfile.js
import React, { useState, useEffect } from 'react';
import '../styles/BreederProfile.css';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPut } from '../utils/apiUtils';

const BreederProfile = () => {
  const [program, setProgram] = useState({
    name: '',
    description: '',
    contact_email: '',
    website: '',
    facility_details: '',
    testimonial: ''
  });

  // Fetch the breeder program details using the environment variable
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiGet('breeders/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProgram(data);
    } catch (error) {
      debugError('Error fetching program:', error);
      debugError('Error details:', error.message);
    }
  };

  const handleChange = (e) => {
    setProgram({ ...program, [e.target.name]: e.target.value });
  };

  const saveProfile = async (profileData) => {
    try {
      const response = await apiPut('breeders/profile', profileData);
      // Handle response...
    } catch (error) {
      // Handle error...
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveProfile(program);
  };

  return (
    <div className="breeder-profile-container">
      <h2 className="page-title">Manage Breeder Profile</h2>
      <form className="breeder-form" onSubmit={handleSave}>
        <div className="form-group">
          <label>Program Name</label>
          <input type="text" name="name" value={program.name} readOnly />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={program.description} onChange={handleChange} placeholder="Describe your breeding program..." />
        </div>
        <div className="form-group">
          <label>Contact Email</label>
          <input type="email" name="contact_email" value={program.contact_email} onChange={handleChange} placeholder="Enter your contact email" />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input type="text" name="website" value={program.website} onChange={handleChange} placeholder="Enter your website URL" />
        </div>
        <div className="form-group">
          <label>Facility Details</label>
          <textarea name="facility_details" value={program.facility_details} onChange={handleChange} placeholder="Describe your facilities..." />
        </div>
        <div className="form-group">
          <label>Testimonial</label>
          <textarea name="testimonial" value={program.testimonial} onChange={handleChange} placeholder="Include a customer testimonial..." />
        </div>
        <button type="submit" className="save-button">Save Changes</button>
      </form>
    </div>
  );
};

export default BreederProfile;
