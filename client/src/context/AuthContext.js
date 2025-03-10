import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, debugLog } from '../config';
import { apiPost, apiGet, apiPut } from '../utils/apiUtils';

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

  // Effect to sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      
      // Try to parse the user from the token
      try {
        // If token is a JWT, it's in the format header.payload.signature
        // We need to extract the payload and decode it
        const parts = token.split('.');
        if (parts.length === 3) {
          // This is likely a JWT token
          const payload = JSON.parse(atob(parts[1]));
          console.log('Decoded token payload:', payload);
          
          // If we don't have user data but have it in the token, use it
          if (!user && payload.user_id) {
            setUser({
              id: payload.user_id,
              email: payload.email,
              name: payload.name || 'User'
            });
          }
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
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
        throw new Error(response.error || 'Login failed');
      }
      
      // The apiPost function already parses the JSON response
      const data = response.data;
      debugLog('Login successful:', data);
      
      // Store token without any Bearer prefix - it will be added when making API requests
      const tokenToStore = data.token.replace('Bearer ', '');
      setToken(tokenToStore);
      setUser(data.user);
      
      // Force token refresh in localStorage
      localStorage.removeItem('token');
      localStorage.setItem('token', tokenToStore);
      
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
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiPost('auth/register', userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      debugLog('Registration successful:', data);
      
      // Automatically log in after registration
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await apiGet('auth/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      setUser(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      throw error;
    }
  };
  
  const updateUserProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiPut('auth/profile', profileData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      setUser(prevUser => ({ ...prevUser, ...data }));
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiPost('auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
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
    getUserProfile,
    updateUserProfile,
    changePassword
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