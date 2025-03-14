import React, { useState } from 'react';
import { API_URL, debugLog, debugError } from '../config';
import { apiPost } from '../utils/apiUtils';

function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      debugLog("Submitting contact form:", formData);
      const response = await apiPost('contact', formData);
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        debugLog("Contact form submitted successfully");
      } else {
        throw new Error(response.error || 'Something went wrong!');
      }
    } catch (err) {
      debugError("Error submitting contact form:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center"><i className="fas fa-envelope"></i> Contact Us</h1>
      {submitted ? (
        <div className="alert alert-success">Thank you! We'll get back to you soon.</div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" required value={formData.email} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Message</label>
            <textarea name="message" className="form-control" rows="4" required value={formData.message} onChange={handleChange}></textarea>
          </div>
          {error && <p className="text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}

export default ContactPage;
