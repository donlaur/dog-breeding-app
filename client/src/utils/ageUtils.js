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