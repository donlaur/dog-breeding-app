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
import { fetchCustomers, fetchRecentLeads, deleteCustomer } from '../../utils/customerApiUtils';
import { API_URL, debugLog, debugError } from '../../config';

// Define customer lead status options for dog breeding
const LEAD_STATUS_OPTIONS = [
  'all',
  'new',
  'contacted',
  'in_conversation',
  'application_sent',
  'application_approved',
  'on_waitlist',
  'puppy_selected',
  'deposit_paid',
  'contract_signed',
  'payment_complete',
  'puppy_delivered',
  'follow_up',
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
        response = await fetchCustomers();
      } else if (status === 'recent') {
        response = await fetchRecentLeads(30);
      } else {
        response = await fetchCustomers({ leadStatus: status });
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
    navigate('/dashboard/customers/new');
  };
  
  const handleEditCustomer = (customerId) => {
    navigate(`/dashboard/customers/${customerId}/edit`);
  };
  
  const handleViewCustomer = (customerId) => {
    navigate(`/dashboard/customers/${customerId}`);
  };
  
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customerName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await deleteCustomer(customerId);
      
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
        <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="All" value="all" />
          <Tab label="New Inquiries" value="new" />
          <Tab label="Contacted" value="contacted" />
          <Tab label="Applications" value="application_approved" />
          <Tab label="Waitlist" value="on_waitlist" />
          <Tab label="Deposits Paid" value="deposit_paid" />
          <Tab label="Delivered" value="puppy_delivered" />
          <Tab label="Follow-ups" value="follow_up" />
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
                        <IconButton onClick={() => navigate(`/dashboard/customers/${customer.id}/files`)} size="small">
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
      return 'rgb(121, 85, 72)'; // Brown
    case 'in_conversation':
      return 'rgb(156, 39, 176)'; // Purple
    case 'application_sent':
      return 'rgb(186, 104, 200)'; // Light purple
    case 'application_received':
      return 'rgb(123, 31, 162)'; // Deep purple
    case 'application_approved':
      return 'rgb(84, 110, 122)'; // Blue gray
    case 'on_waitlist':
      return 'rgb(0, 137, 123)'; // Teal
    case 'puppy_selected':
      return 'rgb(46, 125, 50)'; // Green
    case 'deposit_paid':
      return 'rgb(0, 150, 136)'; // Teal
    case 'contract_signed':
      return 'rgb(0, 200, 83)'; // Success green
    case 'payment_complete':
      return 'rgb(30, 136, 229)'; // Light blue
    case 'puppy_delivered':
      return 'rgb(3, 169, 244)'; // Light blue
    case 'follow_up':
      return 'rgb(255, 152, 0)'; // Orange
    case 'lost':
      return 'rgb(211, 47, 47)'; // Error red
    default:
      return 'rgb(97, 97, 97)'; // Gray
  }
};

export default CustomersPage;
