import React, { useState, useEffect } from 'react';
import './SystemHealthMonitor.css';

const SystemHealthMonitor = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/system');  // Use relative path - proxy will handle it
      if (!response.ok) {
        throw new Error('Server is not responding properly');
      }
      const data = await response.json();
      setHealthStatus(data);
      setError(null);
    } catch (err) {
      setError('Server is not running or unreachable');
      setHealthStatus(null);
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();
    
    // Check every 10 seconds
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!healthStatus && !error) {
    return null;
  }

  return (
    <div className={`health-monitor ${error ? 'error' : healthStatus?.status === 'healthy' ? 'healthy' : 'warning'}`}>
      {error ? (
        <div className="error-message">
          🔴 {error}
        </div>
      ) : (
        <div className="status-message">
          {!healthStatus?.environment?.virtual_env && (
            <div className="warning-message">
              ⚠️ Virtual Environment is not activated
            </div>
          )}
          {healthStatus?.database?.status === 'error' && (
            <div className="warning-message">
              ⚠️ Database Connection Error: {healthStatus.database.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor; 