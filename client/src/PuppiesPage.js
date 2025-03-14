import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from './utils/apiUtils';
import { debugLog, debugError } from './config';

function PuppiesPage() {
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPuppies = async () => {
      try {
        const data = await apiGet('/puppies');
        setPuppies(data);
        setLoading(false);
      } catch (err) {
        debugError('Error fetching puppies:', err);
        setError(err.message || 'Failed to fetch puppies');
        setLoading(false);
      }
    };

    fetchPuppies();
  }, []);

  if (loading) return <div>Loading puppies...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Available Puppies</h1>
      <div className="puppy-grid">
        {puppies.map(puppy => (
          <div key={puppy.id} className="puppy-card">
            <h3>{puppy.name}</h3>
            <p>Age: {puppy.age_weeks} weeks</p>
            <Link to={`/puppies/${puppy.id}`}>View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PuppiesPage;
