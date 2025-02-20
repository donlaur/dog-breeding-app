// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#f4f4f4', color: '#333', padding: '10px 20px', textAlign: 'center' }}>
      <p>&copy; {new Date().getFullYear()} Breeder Tools</p>
    </footer>
  );
};

export default Footer;
