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
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';
import { debugLog, debugError } from '../../config';
import { showSuccess, showError } from '../../utils/notifications';

// Define lead status options with colors
const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#2196F3' },
  { value: 'contacted', label: 'Contacted', color: '#FF9800' },
  { value: 'qualified', label: 'Qualified', color: '#4CAF50' },
  { value: 'negotiating', label: 'Negotiating', color: '#9C27B0' },
  { value: 'sold', label: 'Sold', color: '#3F51B5' },
  { value: 'lost', label: 'Lost', color: '#F44336' }
];

const CustomerLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  useEffect(() => {
    loadLeads(currentTab);
  }, [currentTab]);
  
  const loadLeads = async (status) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (status === 'all') {
        response = await apiGet('customers/recent_leads');
      } else {
        response = await apiGet(`customers?lead_status=${status}`);
      }
      
      if (response.success) {
        const data = response.data || [];
        setLeads(data);
      } else {
        throw new Error(response.error || 'Failed to load leads');
      }
    } catch (error) {
      debugError('Error loading leads:', error);
      setError(`Failed to load leads: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleAddLead = () => {
    navigate('/dashboard/customers/leads/new');
  };
  
  const handleViewLead = (id) => {
    navigate(`/dashboard/customers/leads/${id}`);
  };
  
  const handleEditLead = (id) => {
    navigate(`/dashboard/customers/leads/edit/${id}`);
  };
  
  const handleMenuOpen = (event, lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleStatusDialogOpen = () => {
    setNewStatus(selectedLead.status);
    setStatusDialogOpen(true);
    handleMenuClose();
  };
  
  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };
  
  const handleStatusChange = async () => {
    try {
      const response = await apiPut(`leads/${selectedLead.id}/status`, { status: newStatus });
      
      if (response.ok) {
        showSuccess('Lead status updated successfully');
        loadLeads(currentTab);
      } else {
        throw new Error(`Failed to update lead status: ${response.status}`);
      }
    } catch (error) {
      debugError('Error updating lead status:', error);
      showError(`Failed to update lead status: ${error.message}`);
    } finally {
      setStatusDialogOpen(false);
    }
  };
  
  const handleConvertToCustomer = async () => {
    try {
      const response = await apiPost(`leads/${selectedLead.id}/convert`, {});
      
      if (response.ok) {
        showSuccess('Lead converted to customer successfully');
        loadLeads(currentTab);
      } else {
        throw new Error(`Failed to convert lead: ${response.status}`);
      }
    } catch (error) {
      debugError('Error converting lead:', error);
      showError(`Failed to convert lead: ${error.message}`);
    } finally {
      handleMenuClose();
    }
  };
  
  const handleDeleteLead = async () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const response = await apiDelete(`leads/${selectedLead.id}`);
        
        if (response.ok) {
          showSuccess('Lead deleted successfully');
          loadLeads(currentTab);
        } else {
          throw new Error(`Failed to delete lead: ${response.status}`);
        }
      } catch (error) {
        debugError('Error deleting lead:', error);
        showError(`Failed to delete lead: ${error.message}`);
      } finally {
        handleMenuClose();
      }
    }
  };
  
  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchTermLower) ||
      lead.email?.toLowerCase().includes(searchTermLower) ||
      lead.phone?.toLowerCase().includes(searchTermLower) ||
      lead.notes?.toLowerCase().includes(searchTermLower)
    );
  });
  
  const getStatusChip = (status) => {
    const statusOption = LEAD_STATUS_OPTIONS.find(option => option.value === status) || LEAD_STATUS_OPTIONS[0];
    return (
      <Chip 
        label={statusOption.label} 
        style={{ 
          backgroundColor: statusOption.color,
          color: 'white'
        }}
        size="small"
      />
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lead Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddLead}
        >
          Add New Lead
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
          <Tab label="All Leads" value="all" />
          {LEAD_STATUS_OPTIONS.map(option => (
            <Tab key={option.value} label={option.label} value={option.value} />
          ))}
        </Tabs>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search leads..."
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
      ) : filteredLeads.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No leads found. {searchTerm ? 'Try a different search term.' : 'Add your first lead to get started.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Interest</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {lead.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{lead.email}</Typography>
                        </Box>
                      )}
                      {lead.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{lead.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{lead.interest}</TableCell>
                  <TableCell>{getStatusChip(lead.status)}</TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Lead">
                        <IconButton onClick={() => handleViewLead(lead.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Lead">
                        <IconButton onClick={() => handleEditLead(lead.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton onClick={(e) => handleMenuOpen(e, lead)}>
                          <MoreVertIcon />
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
      
      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleStatusDialogOpen}>
          Update Status
        </MenuItem>
        <MenuItem onClick={handleConvertToCustomer}>
          <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
          Convert to Customer
        </MenuItem>
        <MenuItem onClick={handleDeleteLead} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Lead
        </MenuItem>
      </Menu>
      
      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose}>
        <DialogTitle>Update Lead Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a new status for this lead.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              {LEAD_STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button onClick={handleStatusChange} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerLeads;
