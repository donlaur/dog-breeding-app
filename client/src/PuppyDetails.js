import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from './utils/apiUtils';
import { debugLog, debugError } from './config';

function PuppyDetails() {
  let { id } = useParams();
  const [puppy, setPuppy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPuppyDetails = async () => {
      try {
        const data = await apiGet(`/puppy/${id}`);
        debugLog('Puppy details fetched:', data);
        setPuppy(data);
        setLoading(false);
      } catch (err) {
        debugError('Error fetching puppy details:', err);
        setError(err.message || 'Failed to fetch puppy details');
        setLoading(false);
      }
    };

    fetchPuppyDetails();
  }, [id]);

  if (loading) return <div>Loading puppy details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!puppy) return <div>No puppy found with that ID.</div>;

  return (
    <div>
      <Link to="/puppies">← Back to Puppies</Link>
      <h1>{puppy.name}</h1>
      <p><strong>Age:</strong> {puppy.age_weeks} weeks</p>
      <p><strong>Breed:</strong> {puppy.breed_name}</p>
      <p><strong>Color:</strong> {puppy.color}</p>
      <p><strong>Gender:</strong> {puppy.gender}</p>
      <p><strong>Description:</strong> {puppy.description}</p>
    </div>
  );
}

export default PuppyDetails;
