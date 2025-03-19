import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiGet, apiPost, apiDelete } from '../../utils/apiUtils';
import { 
  fetchCustomers, 
  fetchCustomerCommunications, 
  createCommunication, 
  updateCommunication, 
  deleteCommunication,
  fetchFollowupsDue
} from '../../utils/customerApiUtils';
import { debugLog, debugError } from '../../config';
import { showSuccess, showError } from '../../utils/notifications';

// Communication types with icons
const COMMUNICATION_TYPES = [
  { value: 'email', label: 'Email', icon: <EmailIcon /> },
  { value: 'phone', label: 'Phone Call', icon: <PhoneIcon /> },
  { value: 'message', label: 'Message', icon: <ChatIcon /> },
  { value: 'meeting', label: 'Meeting', icon: <EventIcon /> }
];

const CustomerCommunications = () => {
  const navigate = useNavigate();
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCommunication, setNewCommunication] = useState({
    customer_id: '',
    type: 'email',
    subject: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  useEffect(() => {
    loadData();
  }, [currentTab]);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load customers first
      const customersResponse = await fetchCustomers();
      
      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      }
      
      // Then load communications
      let commResponse;
      
      if (currentTab === 'all') {
        // Get all customer communications or upcoming follow-ups
        // For now, we'll get follow-ups due in the next 30 days
        commResponse = await fetchFollowupsDue(30);
      } else if (currentTab === 'followups') {
        // Get follow-ups due in the next 7 days
        commResponse = await fetchFollowupsDue(7);
      } else {
        // We could add filtering by type later
        commResponse = await fetchFollowupsDue(30);
      }
      
      if (commResponse.success) {
        setCommunications(commResponse.data || []);
      } else {
        throw new Error(commResponse.error || 'Failed to load communications');
      }
    } catch (error) {
      debugError('Error loading communications data:', error);
      setError(`Failed to load communications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCommunication(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddCommunication = async () => {
    try {
      const response = await createCommunication(
        newCommunication.customer_id, 
        {
          communication_type: newCommunication.type,
          subject: newCommunication.subject,
          content: newCommunication.content,
          initiated_by: 'breeder',
          follow_up_date: newCommunication.date ? `${newCommunication.date} 12:00:00` : null,
          notes: newCommunication.notes || ''
        }
      );
      
      if (response.success) {
        showSuccess('Communication added successfully');
        loadData();
        setDialogOpen(false);
        // Reset form
        setNewCommunication({
          customer_id: '',
          type: 'email',
          subject: '',
          content: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        throw new Error(response.error || 'Failed to add communication');
      }
    } catch (error) {
      debugError('Error adding communication:', error);
      showError(`Failed to add communication: ${error.message}`);
    }
  };
  
  const handleDeleteCommunication = async (id) => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        const response = await deleteCommunication(id);
        
        if (response.success) {
          showSuccess('Communication deleted successfully');
          loadData();
        } else {
          throw new Error(response.error || 'Failed to delete communication');
        }
      } catch (error) {
        debugError('Error deleting communication:', error);
        showError(`Failed to delete communication: ${error.message}`);
      }
    }
  };
  
  const filteredCommunications = communications.filter(comm => {
    const searchTermLower = searchTerm.toLowerCase();
    const customerName = customers.find(c => c.id === comm.customer_id)?.name || '';
    
    return (
      customerName.toLowerCase().includes(searchTermLower) ||
      comm.subject?.toLowerCase().includes(searchTermLower) ||
      comm.content?.toLowerCase().includes(searchTermLower)
    );
  });
  
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };
  
  const getCommunicationTypeIcon = (type) => {
    const commType = COMMUNICATION_TYPES.find(t => t.value === type);
    return commType ? commType.icon : <ChatIcon />;
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Communications
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Add Communication
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Communications" value="all" />
          {COMMUNICATION_TYPES.map(type => (
            <Tab 
              key={type.value} 
              label={type.label} 
              value={type.value}
              icon={type.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search communications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCommunications.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No communications found. {searchTerm ? 'Try a different search term.' : 'Add your first communication to get started.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCommunications.map((comm) => (
            <Grid item xs={12} md={6} lg={4} key={comm.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getInitials(getCustomerName(comm.customer_id))}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {getCustomerName(comm.customer_id)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          icon={getCommunicationTypeIcon(comm.type)} 
                          label={comm.type} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(comm.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {comm.subject}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {comm.content}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => navigate(`/customers/${comm.customer_id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Delete">
                    <IconButton 
                      color="error"
                      onClick={() => handleDeleteCommunication(comm.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Add Communication Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Communication</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Record a new communication with a customer.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={newCommunication.customer_id}
                  onChange={handleInputChange}
                  label="Customer"
                  required
                >
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={newCommunication.type}
                  onChange={handleInputChange}
                  label="Type"
                >
                  {COMMUNICATION_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(type.icon, { sx: { mr: 1 } })}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="date"
                value={newCommunication.date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={newCommunication.subject}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                name="content"
                value={newCommunication.content}
                onChange={handleInputChange}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleAddCommunication} 
            color="primary"
            disabled={!newCommunication.customer_id || !newCommunication.subject}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCommunications;
