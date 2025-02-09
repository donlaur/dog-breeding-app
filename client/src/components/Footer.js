import React from 'react';

function Footer() {
  return (
    <footer className="bg-light text-center py-3">
      <p>© {new Date().getFullYear()} Laur’s Classic Corgis | <a href="/contact">Contact Us</a></p>
    </footer>
  );
}

export default Footer;
