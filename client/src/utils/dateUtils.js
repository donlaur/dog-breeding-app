import { format, differenceInWeeks, differenceInMonths, differenceInYears, addWeeks, addMonths, addYears } from 'date-fns';

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
};

export const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    const weeks = Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 7));
    
    if (weeks < 1) {
        const days = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
        return `${days} days old`;
    }
    return `${weeks} weeks old`;
};

/**
 * Formats an age from a birth date according to these rules:
 * - Under 4 months: Show weeks
 * - Under 1 year: Show months and weeks
 * - Over 1 year: Show years and months
 * @param {string|Date} birthDate - The birth date to calculate age from
 * @returns {string} Formatted age string
 */
export const formatAge = (birthDate) => {
  if (!birthDate) return '';
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  const weeks = differenceInWeeks(today, birth);
  const months = differenceInMonths(today, birth);
  const years = differenceInYears(today, birth);
  
  // Under 4 months (16 weeks)
  if (weeks < 16) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
  }
  
  // Under 1 year
  if (years < 1) {
    const remainingWeeks = weeks - (Math.floor(months) * 4);
    return `${months} ${months === 1 ? 'month' : 'months'}, ${remainingWeeks} ${remainingWeeks === 1 ? 'week' : 'weeks'} old`;
  }
  
  // Over 1 year
  const remainingMonths = months - (years * 12);
  return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'} old`;
}; 