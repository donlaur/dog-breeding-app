// src/components/common/FallbackImage.js
import React, { useState, useEffect } from 'react';
import { API_URL, debugLog } from '../../config';

/**
 * FallbackImage component that handles missing images gracefully
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Original image source
 * @param {string} props.fallbackSrc - Fallback image source if original fails
 * @param {Object} props.imgProps - Additional props to pass to the img element
 * @returns {React.ReactElement} - Image component with fallback handling
 */
const FallbackImage = ({ 
  src, 
  fallbackSrc = '/images/dog-paw-print.png', 
  alt = 'Image', 
  ...imgProps 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  // Reset the error state when src changes
  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    if (!error) {
      debugLog(`Image failed to load: ${src}, using fallback`);
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...imgProps}
    />
  );
};

export default FallbackImage;
