import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Paper,
  Grid
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import PageNavigation from '../../components/PageNavigation';

const NotFoundPage = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <PageNavigation />
      <Container maxWidth="lg">
        <Box sx={{ mt: 8, mb: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Box 
              component="img" 
              src="https://images.unsplash.com/photo-1603077747770-e804e3f0e1e4?q=80&w=2069" 
              alt="Confused dog"
              sx={{ 
                maxWidth: '100%', 
                height: 'auto', 
                maxHeight: 300,
                borderRadius: 2,
                mb: 3
              }}
            />
            
            <Typography variant="h2" component="h1" gutterBottom color="primary">
              404
            </Typography>
            
            <Typography variant="h4" gutterBottom>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" paragraph color="text.secondary">
              We couldn't find the page you were looking for: <strong>{path}</strong>
            </Typography>
            
            <Typography variant="body1" paragraph>
              The page may have been moved, deleted, or may never have existed.
            </Typography>
            
            <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Grid item>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/"
                  size="large"
                >
                  Return to Homepage
                </Button>
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  component={Link} 
                  to="/dashboard"
                  size="large"
                >
                  Go to Dashboard
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default NotFoundPage;