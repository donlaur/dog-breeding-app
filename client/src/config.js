// src/config.js
// You can optionally read these from environment variables too.
export const API_URL = process.env.REACT_APP_API_URL;
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
