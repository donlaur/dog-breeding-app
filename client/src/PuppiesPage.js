import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from './utils/apiUtils';
import { debugError } from './config';

function PuppiesPage() {
  const [puppies, setPuppies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuppies = async () => {
      try {
        const response = await apiGet('puppies');
        if (response.ok) {
          setPuppies(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        debugError('Error fetching puppies:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPuppies();
  }, []);

  const handleImageError = (e) => {
    e.target.src = "";
    e.target.onerror = null; // Prevents infinite loop
  };

  if (loading) return <p className="text-center mt-4">Loading puppies...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center"><i className="fas fa-paw"></i> Puppies Page</h1>
      <div className="text-center mb-3">
        <Link to="/" className="btn btn-primary">
          <i className="fas fa-home"></i> Back to Home
        </Link>
      </div>
      {error && <p className="alert alert-danger">{error}</p>}
      <div className="row">
        {puppies.map((puppy) => (
          <div key={puppy.id} className="col-md-4">
            <div className="card shadow-sm p-3 mb-4">
              {/* If the image fails to load, fall back to the FontAwesome icon */}
              {puppy.image ? (
                <img
                  src={`/images/${puppy.image}`}
                  alt={puppy.name}
                  className="card-img-top"
                  onError={handleImageError}  // Handles broken images
                />
              ) : (
                <div className="text-center py-3">
                  <i className="fas fa-dog fa-5x text-muted"></i>
                </div>
              )}
              <div className="card-body">
                <h5 className="card-title">{puppy.name}</h5>
                <p className="card-text">{puppy.gender} - ${puppy.price}</p>
                <Link to={`/puppy/${puppy.id}`} className="btn btn-primary">
                  <i className="fas fa-info-circle"></i> View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PuppiesPage;
