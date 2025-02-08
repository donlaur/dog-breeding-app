import React, { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => setHealth(data.status))
      .catch(err => setHealth('Error'));
  }, []);

  return (
    <div>
      <h1>Dog Breeding App</h1>
      <p>Health status: {health}</p>
    </div>
  );
}

export default App;
