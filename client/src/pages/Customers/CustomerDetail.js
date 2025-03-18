import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Chip,
  Container,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { API_URL, debugLog, debugError } from '../../config';
import { apiGet } from '../../utils/apiUtils';
import CustomerInfo from '../../components/customers/CustomerInfo';
import CustomerCommunications from '../../components/customers/CustomerCommunications';
import CustomerContracts from '../../components/customers/CustomerContracts';
import CustomerPuppies from '../../components/customers/CustomerPuppies';

/**
 * Detailed view of a customer, showing their basic information,
 * communication history, contracts, and puppies
 */
const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiGet(`customers/${customerId}`);
        
        if (response.success) {
          setCustomer(response.data);
        } else {
          throw new Error(response.error || 'Could not load customer data');
        }
      } catch (error) {
        debugError('Error fetching customer:', error);
        setError('Failed to load customer data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box my={4} display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error || !customer) {
    return (
      <Container maxWidth="lg">
        <Box my={4}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard/customers')}
            sx={{ mb: 2 }}
          >
            Back to Customers
          </Button>
          <Alert severity="error">
            {error || 'Customer not found'}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        {/* Header with navigation and actions */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/dashboard/customers')}
            >
              Back to Customers
            </Button>
          </Grid>
          <Grid item xs />
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => navigate(`/dashboard/customers/${customerId}/edit`)}
            >
              Edit Customer
            </Button>
          </Grid>
        </Grid>
        
        {/* Customer name heading */}
        <Typography variant="h4" component="h1" gutterBottom>
          {customer.name}
        </Typography>
        
        {/* Tabs for different sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="customer details tabs"
          >
            <Tab label="Info" />
            <Tab label="Communications" />
            <Tab label="Contracts" />
            <Tab label="Puppies" />
          </Tabs>
        </Box>
        
        {/* Tab content */}
        <Box sx={{ mt: 3 }}>
          {/* Info Tab */}
          {currentTab === 0 && (
            <CustomerInfo customer={customer} />
          )}
          
          {/* Communications Tab */}
          {currentTab === 1 && (
            <CustomerCommunications 
              customerId={customerId} 
              customerName={customer.name} 
            />
          )}
          
          {/* Contracts Tab */}
          {currentTab === 2 && (
            <CustomerContracts 
              customerId={customerId} 
              customerName={customer.name} 
            />
          )}
          
          {/* Puppies Tab */}
          {currentTab === 3 && (
            <CustomerPuppies 
              customerId={customerId} 
              customerName={customer.name} 
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

// No PropTypes needed here as the component does not receive any props

export default CustomerDetail;
