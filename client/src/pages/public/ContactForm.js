import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interestType: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setOpenSnackbar(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          interestType: '',
          message: ''
        });
      } else {
        throw new Error(data.error || 'Failed to submit contact form');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(err.message || 'Something went wrong. Please try again later.');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Contact Us
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
            Interested in our dogs or have questions? Fill out the form below and we'll get back to you as soon as possible.
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="interest-type-label">Interest Type</InputLabel>
              <Select
                labelId="interest-type-label"
                id="interestType"
                name="interestType"
                value={formData.interestType}
                label="Interest Type"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="puppy">Purchasing a Puppy</MenuItem>
                <MenuItem value="stud">Stud Services</MenuItem>
                <MenuItem value="general">General Questions</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="message"
              label="Message"
              name="message"
              multiline
              rows={4}
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </Paper>
      </Box>
      
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={success ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {success 
            ? "Thank you for your message! We'll get back to you soon." 
            : error || "Failed to send message. Please try again."}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContactForm;
