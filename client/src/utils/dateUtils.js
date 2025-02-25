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