import React, { Component } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { showError } from './notifications';
import { debugError } from '../config';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child
 * component tree and display a fallback UI instead of crashing the app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    debugError('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Show error notification
    showError('An error occurred. Please try again or contact support if the issue persists.');
    
    // You can also log to an error reporting service here
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Box 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh'
          }}
        >
          <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            <Alert severity="error" sx={{ my: 2 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Alert>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // Render children if there's no error
    return this.props.children;
  }
}

export default ErrorBoundary; 