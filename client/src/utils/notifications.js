/**
 * Notification Utility
 * 
 * This utility provides a consistent way to show notifications
 * throughout the application using Material UI's Snackbar and Alert components.
 */
import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { createRoot } from 'react-dom/client';
import { debugError } from '../config';

// Track active notification containers to prevent duplicate cleanup
const activeContainers = new Set();

// Default options for notifications
const DEFAULT_OPTIONS = {
  autoHideDuration: 4000,
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  transitionDuration: { enter: 300, exit: 200 },
};

/**
 * Safely removes a container element from the DOM
 * @param {HTMLElement} containerDiv - The container to remove
 */
const safeRemoveContainer = (containerDiv) => {
  try {
    // Only proceed if the container is still in the DOM and tracked
    if (document.body.contains(containerDiv) && activeContainers.has(containerDiv)) {
      document.body.removeChild(containerDiv);
      activeContainers.delete(containerDiv);
    }
  } catch (error) {
    debugError('Error removing notification container:', error);
  }
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
  
  // Add the container to tracked containers and to DOM
  activeContainers.add(containerDiv);
  document.body.appendChild(containerDiv);
  
  // Create a root for the container
  let root;
  try {
    root = createRoot(containerDiv);
  } catch (error) {
    debugError('Error creating root for notification:', error);
    safeRemoveContainer(containerDiv);
    return;
  }
  
  // Merge default options with custom options
  const snackbarOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  
  // Function to clean up the DOM when the notification is closed
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    
    // First unmount the component
    try {
      root.unmount();
    } catch (error) {
      debugError('Error unmounting notification:', error);
    }
    
    // Then remove the container after a small delay
    setTimeout(() => {
      safeRemoveContainer(containerDiv);
    }, 100);
  };
  
  // Render the Snackbar with Alert
  try {
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
  } catch (error) {
    debugError('Error rendering notification:', error);
    safeRemoveContainer(containerDiv);
    return;
  }
  
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