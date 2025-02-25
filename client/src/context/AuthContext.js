import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.getCurrentSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email, password) => {
    clearError();
    const { user: authUser, error: authError } = await authService.signIn(email, password);
    if (authError) {
      setError(authError);
      return false;
    }
    setUser(authUser);
    return true;
  };

  const signUp = async (email, password) => {
    clearError();
    const { user: authUser, error: authError } = await authService.signUp(email, password);
    if (authError) {
      setError(authError);
      return false;
    }
    setUser(authUser);
    return true;
  };

  const signOut = async () => {
    clearError();
    const { error: authError } = await authService.signOut();
    if (authError) {
      setError(authError);
      return false;
    }
    setUser(null);
    return true;
  };

  const resetPassword = async (email) => {
    clearError();
    const { error: authError } = await authService.resetPassword(email);
    if (authError) {
      setError(authError);
      return false;
    }
    return true;
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 