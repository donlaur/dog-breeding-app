import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import FolderIcon from '@mui/icons-material/Folder';
import { apiGet, apiDelete } from '../../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../../config';

// Define customer lead status options
const LEAD_STATUS_OPTIONS = [
  'all',
  'new',
  'contacted',
  'qualified',
  'negotiating',
  'sold',
  'lost'
];

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    loadCustomers(currentTab);
  }, [currentTab]);
  
  const loadCustomers = async (status) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (status === 'all') {
        response = await apiGet('customers');
      } else if (status === 'recent') {
        response = await apiGet('customers/recent');
      } else {
        response = await apiGet(`customers?leadStatus=${status}`);
      }
      
      if (response.success) {
        setCustomers(response.data || []);
      } else {
        throw new Error(response.error || 'Failed to load customers');
      }
    } catch (error) {
      debugError('Error loading customers:', error);
      setError(`Failed to load customers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleAddCustomer = () => {
    navigate('/customers/new');
  };
  
  const handleEditCustomer = (customerId) => {
    navigate(`/customers/${customerId}/edit`);
  };
  
  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };
  
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customerName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiDelete(`customers/${customerId}`);
      
      if (response.success) {
        // Refresh the customer list
        loadCustomers(currentTab);
      } else {
        throw new Error(response.error || 'Failed to delete customer');
      }
    } catch (error) {
      debugError('Error deleting customer:', error);
      setError(`Failed to delete customer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchFields = [
      customer.name,
      customer.email,
      customer.phone,
      customer.city,
      customer.state,
      customer.country,
      customer.lead_source
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchFields.includes(searchTerm.toLowerCase());
  });
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Add New Customer
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="All Customers" value="all" />
          <Tab label="New Leads" value="new" />
          <Tab label="Contacted" value="contacted" />
          <Tab label="Qualified" value="qualified" />
          <Tab label="Negotiating" value="negotiating" />
          <Tab label="Sold" value="sold" />
          <Tab label="Recent (30 days)" value="recent" />
        </Tabs>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search customers by name, email, phone, or location..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredCustomers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No customers found{searchTerm ? ' matching your search' : ' in this category'}.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Information</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Lead Status</TableCell>
                <TableCell>Lead Source</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" />
                          <Typography variant="body2">{customer.email}</Typography>
                        </Box>
                      )}
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" />
                          <Typography variant="body2">{customer.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {[customer.city, customer.state, customer.country]
                      .filter(Boolean)
                      .join(', ')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'inline-block',
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      bgcolor: getLeadStatusColor(customer.lead_status),
                      color: 'white'
                    }}>
                      {customer.lead_status || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>{customer.lead_source || 'Unknown'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewCustomer(customer.id)} size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Customer">
                        <IconButton onClick={() => handleEditCustomer(customer.id)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Customer Files">
                        <IconButton onClick={() => navigate(`/customers/${customer.id}/files`)} size="small">
                          <FolderIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Customer">
                        <IconButton 
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// Helper function to get color for lead status
const getLeadStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'rgb(25, 118, 210)'; // Primary blue
    case 'contacted':
      return 'rgb(156, 39, 176)'; // Purple
    case 'qualified':
      return 'rgb(46, 125, 50)'; // Green
    case 'negotiating':
      return 'rgb(237, 108, 2)'; // Orange
    case 'sold':
      return 'rgb(0, 200, 83)'; // Success green
    case 'lost':
      return 'rgb(211, 47, 47)'; // Error red
    default:
      return 'rgb(97, 97, 97)'; // Gray
  }
};

export default CustomersPage;
