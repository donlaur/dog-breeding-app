import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// This is a convenience hook that simply forwards the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
