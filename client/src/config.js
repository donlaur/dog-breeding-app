// src/config.js
// Use relative URL for development with proxy
export const API_URL = '/api';
export const SUPABASE_URL = 'https://rezchuvoipnekcbbwlis.supabase.co';
export const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true';

console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);

// Create a debug logger utility
export const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

export const debugError = (...args) => {
  if (DEBUG_MODE) {
    console.error(...args);
  }
};
