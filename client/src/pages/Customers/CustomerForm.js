import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { debugLog, debugError } from '../../config';
import { apiPost, apiPut, apiGet } from '../../utils/apiUtils';
import { createCustomer, fetchCustomerById, updateCustomer } from '../../utils/customerApiUtils';

// Lead status options
const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'sold', label: 'Sold' },
  { value: 'lost', label: 'Lost' }
];

// Lead source options
const LEAD_SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' }
];

// Preferred contact method options
const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'text', label: 'Text Message' },
  { value: 'any', label: 'Any' }
];

const CustomerForm = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(customerId);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    notes: '',
    lead_status: 'new',
    lead_source: '',
    preferred_contact_method: 'email',
    interests: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (isEditMode) {
      loadCustomerData();
    }
  }, [customerId]);
  
  const loadCustomerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`customers/${customerId}`);
      
      if (response.success) {
        // Populate form with customer data
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zip_code: response.data.zip_code || '',
          country: response.data.country || '',
          notes: response.data.notes || '',
          lead_status: response.data.lead_status || 'new',
          lead_source: response.data.lead_source || '',
          preferred_contact_method: response.data.preferred_contact_method || 'email',
          interests: response.data.interests || ''
        });
      } else {
        throw new Error(response.error || 'Failed to load customer data');
      }
    } catch (error) {
      debugError('Error loading customer:', error);
      setError(`Failed to load customer data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      setError('Customer name is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditMode) {
        // Update existing customer
        response = await apiPut(`customers/${customerId}`, formData);
      } else {
        // Create new customer
        response = await apiPost('customers', formData);
      }
      
      if (response.success) {
        // Navigate to customer detail page or customer list
        if (isEditMode) {
          navigate(`/dashboard/customers/${customerId}`);
        } else if (response.data?.id) {
          navigate(`/dashboard/customers/${response.data.id}`);
        } else {
          navigate('/dashboard/customers');
        }
      } else {
        throw new Error(response.error || 'Failed to save customer');
      }
    } catch (error) {
      debugError('Error saving customer:', error);
      setError(`Failed to save customer: ${error.message}`);
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(isEditMode ? `/dashboard/customers/${customerId}` : '/dashboard/customers')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Name *"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="preferred-contact-method-label">Preferred Contact Method</InputLabel>
                <Select
                  labelId="preferred-contact-method-label"
                  name="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={handleInputChange}
                  label="Preferred Contact Method"
                >
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Street Address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="state"
                label="State/Province"
                value={formData.state}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="zip_code"
                label="ZIP/Postal Code"
                value={formData.zip_code}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="country"
                label="Country"
                value={formData.country}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Lead Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="lead-status-label">Lead Status</InputLabel>
                <Select
                  labelId="lead-status-label"
                  name="lead_status"
                  value={formData.lead_status}
                  onChange={handleInputChange}
                  label="Lead Status"
                >
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="lead-source-label">Lead Source</InputLabel>
                <Select
                  labelId="lead-source-label"
                  name="lead_source"
                  value={formData.lead_source}
                  onChange={handleInputChange}
                  label="Lead Source"
                >
                  <MenuItem value="">Unknown</MenuItem>
                  {LEAD_SOURCE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="interests"
                label="Interests"
                value={formData.interests}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

CustomerForm.propTypes = {
  customerId: PropTypes.string
};

export default CustomerForm;
