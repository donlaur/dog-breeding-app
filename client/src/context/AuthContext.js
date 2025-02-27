import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, debugLog } from '../config';
import { apiPost, apiGet } from '../utils/apiUtils';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize state from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save to localStorage whenever token/user changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [token, user]);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiPost('auth/login', { email, password });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      debugLog('Login successful:', data);
      
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Auth header helper
  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const register = async (userData) => {
    try {
      const response = await apiPost('auth/register', userData);
      // Handle response...
    } catch (error) {
      // Handle error...
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await apiGet('users/profile');
      // Handle response...
    } catch (error) {
      // Handle error...
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    getAuthHeader,
    register,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext; 