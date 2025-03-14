import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from './utils/apiUtils';
import { debugError } from './config';

function PuppyDetails() {
  let { id } = useParams();
  const [puppy, setPuppy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPuppyDetails = async () => {
      try {
        const response = await apiGet(`puppy/${id}`);
        if (response.ok) {
          setPuppy(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        debugError('Error fetching puppy details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPuppyDetails();
  }, [id]);

  if (loading) return <p className="text-center mt-4">Loading puppy details...</p>;
  if (error) return <p className="alert alert-danger">{error}</p>;
  if (!puppy) return <p className="alert alert-warning">Puppy not found.</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center"><i className="fas fa-paw"></i> {puppy.name}</h1>
      <div className="card shadow-sm p-3">
        {/* 🛑 Show default FontAwesome icon if image is missing */}
        {puppy.image ? (
          <img src={`/images/${puppy.image}`} alt={puppy.name} className="card-img-top"/>
        ) : (
          <div className="text-center py-3">
            <i className="fas fa-dog fa-5x text-muted"></i>
          </div>
        )}
        <div className="card-body">
          <h5 className="card-title">{puppy.name}</h5>
          <p className="card-text">
            <strong>Gender:</strong> {puppy.gender} <br />
            <strong>Price:</strong> ${puppy.price} <br />
            <strong>Breed:</strong> {puppy.breed} <br />
            <strong>Age:</strong> {puppy.age} weeks
          </p>
          <button className="btn btn-success">
            <i className="fas fa-check"></i> Reserve Puppy
          </button>
          <Link to="/puppies" className="btn btn-secondary ms-3">
            <i className="fas fa-arrow-left"></i> Back to Puppies
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PuppyDetails;
