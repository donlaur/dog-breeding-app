// src/pages/BreederProfile.js
import React, { useState, useEffect } from 'react';
import '../styles/BreederProfile.css';
import { API_URL, debugLog, debugError } from '../config';

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
    fetch(`${API_URL}/program/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        debugLog("Program data received:", data);
        setProgram({
          name: data.name || '',
          description: data.description || '',
          contact_email: data.contact_email || '',
          website: data.website || '',
          facility_details: data.facility_details || '',
          testimonial: data.testimonial || ''
        });
      })
      .catch((error) => {
        debugError('Error fetching program:', error);
        debugError('Error details:', error.message);
      });
  }, []);

  const handleChange = (e) => {
    setProgram({ ...program, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/program`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(program),
    })
      .then((response) => response.json())
      .then((data) => {
        setProgram({
          name: data.name || '',
          description: data.description || '',
          contact_email: data.contact_email || '',
          website: data.website || '',
          facility_details: data.facility_details || '',
          testimonial: data.testimonial || ''
        });
      })
      .catch((error) => console.error('Error updating program:', error));
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
