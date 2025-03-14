import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getPhotoUrl, handleImageError, DEFAULT_DOG_IMAGE } from '../utils/photoUtils';
import { Skeleton, Box, Card } from '@mui/material';

// Skeleton version of DogCard for loading states
export const DogCardSkeleton = () => {
  return (
    <div className="dog-card">
      <Card>
        <Skeleton variant="rectangular" height={200} width="100%" animation="wave" />
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" width="70%" height={28} animation="wave" />
          <Skeleton variant="text" width="90%" height={20} animation="wave" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Skeleton variant="text" width="40%" height={20} animation="wave" />
            <Skeleton variant="text" width="30%" height={20} animation="wave" />
          </Box>
          <Skeleton variant="rectangular" width="50%" height={24} sx={{ mt: 1.5, borderRadius: 1 }} animation="wave" />
        </Box>
      </Card>
    </div>
  );
};

const DogCard = ({ dog, loading = false }) => {
  
  // Return skeleton if loading
  if (loading) {
    return <DogCardSkeleton />;
  }
  // Safely access properties with defaults
  const {
    id,
    call_name = '',
    registered_name = '',
    cover_photo,
    gender = '',
    status = 'Active',
    date_of_birth
  } = dog || {};

  // Calculate age if date_of_birth is available
  const getAge = (dob) => {
    if (!dob) return '';
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years}y ${months}m`;
    } else {
      return `${months}m`;
    }
  };

  const ageText = getAge(date_of_birth);

  return (
    <div className="dog-card">
      <Link to={`/dashboard/dogs/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <img 
          src={cover_photo ? getPhotoUrl(cover_photo, 'DOG') : DEFAULT_DOG_IMAGE} 
          alt={call_name} 
          className="dog-image"
          onError={handleImageError('DOG')}
        />
        
        <h3>{call_name}</h3>
        <p>{registered_name}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <span>{gender}</span>
          {ageText && <span>{ageText}</span>}
        </div>
        
        <div style={{ 
          marginTop: '5px',
          padding: '3px 8px',
          borderRadius: '4px',
          display: 'inline-block',
          backgroundColor: status === 'Active' ? '#e6f7e6' : '#f7e6e6',
          color: status === 'Active' ? '#2e7d32' : '#c62828'
        }}>
          {status}
        </div>
      </Link>
    </div>
  );
};

DogCard.propTypes = {
  dog: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    call_name: PropTypes.string,
    registered_name: PropTypes.string,
    cover_photo: PropTypes.string,
    gender: PropTypes.string,
    status: PropTypes.string,
    date_of_birth: PropTypes.string
  }).isRequired,
  loading: PropTypes.bool
};

export default DogCard;