/**
 * Format adult dog age in years and months
 * 
 * @param {string} birthDate - Birth date string
 * @returns {string} Formatted age
 */
export const formatAdultAge = (birthDate) => {
  if (!birthDate) return '';
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    // Adjust years and months if needed
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Format the result
    if (years > 0 && months > 0) {
      return `${years}y ${months}m`;
    } else if (years > 0) {
      return `${years}y`;
    } else {
      return `${months}m`;
    }
  } catch (err) {
    console.error("Error formatting age:", err);
    return '';
  }
};

/**
 * Calculate a dog's age from their date of birth
 * @param {string} dateOfBirth - Date of birth in any standard format
 * @returns {string} - Formatted age string (e.g., "2 years" or "3 months")
 */
export const getDogAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Calculate years
    let years = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust if birthday hasn't occurred yet this year
    if (
      today.getMonth() < birthDate.getMonth() || 
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      years--;
    }
    
    // For puppies, show age in months
    if (years < 1) {
      let months = today.getMonth() - birthDate.getMonth();
      // Adjust if day of month is less than birth day
      if (today.getDate() < birthDate.getDate()) {
        months--;
      }
      // Adjust for negative months (when birth month is later in year than current month)
      if (months < 0) {
        months += 12;
      }
      
      // For very young puppies, show weeks
      if (months === 0) {
        const birthTime = birthDate.getTime();
        const nowTime = today.getTime();
        const diffTime = Math.abs(nowTime - birthTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        
        if (diffWeeks === 0) {
          return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
        } else {
          return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'}`;
        }
      }
      
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    
    // For adult dogs, show age in years
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } catch (err) {
    console.error('Error calculating dog age:', err);
    return null;
  }
};

/**
 * Format a dog's age category (puppy, adult, senior)
 * @param {string} dateOfBirth - Date of birth in any standard format
 * @returns {string} - Age category
 */
export const getDogAgeCategory = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown';
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Calculate years
    let years = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust if birthday hasn't occurred yet this year
    if (
      today.getMonth() < birthDate.getMonth() || 
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      years--;
    }
    
    if (years < 1) return 'Puppy';
    if (years < 7) return 'Adult';
    return 'Senior';
  } catch (err) {
    console.error('Error calculating dog age category:', err);
    return 'Unknown';
  }
};