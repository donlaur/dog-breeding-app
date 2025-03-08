import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component that adds a global keyboard shortcut (Ctrl+K or Cmd+K) for search
 * Should be included once at a high level in the component tree
 */
const GlobalSearchShortcut = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger search when pressing Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/dashboard/search');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  // This component doesn't render anything
  return null;
};

export default GlobalSearchShortcut;