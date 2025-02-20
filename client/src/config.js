// src/config.js

// You can optionally read these from environment variables too.
export const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";
export const DEBUG = process.env.REACT_APP_DEBUG === "true" || true; // Set to false to turn off logging

// A helper function for logging that only logs when DEBUG is true.
export const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};
