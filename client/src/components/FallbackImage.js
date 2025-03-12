import React, { useState } from 'react';
import { debugLog } from '../config';

/**
 * FallbackImage component that gracefully handles 404 errors for images
 * by displaying a fallback image instead
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Primary image source
 * @param {string} props.fallbackSrc - Fallback image source to use if primary fails
 * @param {string} props.alt - Alt text for the image
 * @param {Object} props.style - Additional styles for the image
 * @param {string} props.className - CSS class for the image
 * @returns {React.Component} Image component with error handling
 */
const FallbackImage = ({ 
  src, 
  fallbackSrc = '/images/dog-paw-print.png', 
  alt = 'Image', 
  style = {}, 
  className = '',
  ...rest 
}) => {
  const [error, setError] = useState(false);
  
  const handleError = () => {
    debugLog(`Image not found: ${src}, using fallback`);
    setError(true);
  };
  
  return (
    <img
      src={error ? fallbackSrc : src}
      alt={alt}
      style={style}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
};

export default FallbackImage;
