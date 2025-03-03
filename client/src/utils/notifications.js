/**
 * Notification Utility
 * 
 * This utility provides a consistent way to show notifications
 * throughout the application using Material UI's Snackbar and Alert components.
 */
import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { createRoot } from 'react-dom/client';

// Default options for notifications
const DEFAULT_OPTIONS = {
  autoHideDuration: 4000,
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  transitionDuration: { enter: 300, exit: 200 },
};

/**
 * Creates a container for the notification and renders it
 * @param {string} message - The message to display
 * @param {string} severity - The severity level ('success', 'error', 'info', 'warning')
 * @param {Object} options - Custom options to override defaults
 */
const showNotification = (message, severity, options = {}) => {
  // Create a div to render the Snackbar into
  const containerDiv = document.createElement('div');
  document.body.appendChild(containerDiv);
  
  // Create a root for the container
  const root = createRoot(containerDiv);
  
  // Merge default options with custom options
  const snackbarOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  
  // Function to clean up the DOM when the notification is closed
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    
    // Unmount and remove the container
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(containerDiv);
    }, 300); // Small delay to allow exit animation
  };
  
  // Render the Snackbar with Alert
  root.render(
    <Snackbar
      open={true}
      autoHideDuration={snackbarOptions.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={snackbarOptions.anchorOrigin}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
  
  // Automatically clean up after the autoHideDuration
  setTimeout(() => {
    handleClose(null, 'timeout');
  }, snackbarOptions.autoHideDuration + 500);
};

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {Object} options - Override default notification options
 */
export const showSuccess = (message, options = {}) => {
  showNotification(message, 'success', options);
};

/**
 * Show an error notification
 * @param {string} message - The message to display
 * @param {Object} options - Override default notification options
 */
export const showError = (message, options = {}) => {
  showNotification(message, 'error', options);
};

/**
 * Show an info notification
 * @param {string} message - The message to display
 * @param {Object} options - Override default notification options
 */
export const showInfo = (message, options = {}) => {
  showNotification(message, 'info', options);
};

/**
 * Show a warning notification
 * @param {string} message - The message to display
 * @param {Object} options - Override default notification options
 */
export const showWarning = (message, options = {}) => {
  showNotification(message, 'warning', options);
}; 