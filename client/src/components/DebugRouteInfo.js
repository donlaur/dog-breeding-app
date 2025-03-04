import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// This component displays current route information for debugging
const DebugRouteInfo = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    console.log('Current route:', location.pathname);
  }, [location]);
  
  // Toggle visibility with 'd' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'd' && e.ctrlKey) {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div>Current Path: {location.pathname}</div>
      <div>Search: {location.search}</div>
      <div>Hash: {location.hash}</div>
      <div>State: {JSON.stringify(location.state)}</div>
      <div>Key: {location.key}</div>
      <div><small>Press Ctrl+D to hide</small></div>
    </div>
  );
};

export default DebugRouteInfo;