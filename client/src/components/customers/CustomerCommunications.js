import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PhoneEnabledIcon from '@mui/icons-material/PhoneEnabled';
import ForumIcon from '@mui/icons-material/Forum';
import EventIcon from '@mui/icons-material/Event';
import { API_URL, debugLog, debugError } from '../../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';

// Communication type options
const COMMUNICATION_TYPES = [
  { value: 'email', label: 'Email', icon: <MarkEmailReadIcon fontSize="small" /> },
  { value: 'phone', label: 'Phone Call', icon: <PhoneEnabledIcon fontSize="small" /> },
  { value: 'in_person', label: 'In Person', icon: <ForumIcon fontSize="small" /> },
  { value: 'other', label: 'Other', icon: <EventIcon fontSize="small" /> }
];

const CustomerCommunications = ({ customerId, customerName, onCommunicationChange }) => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCommunication, setCurrentCommunication] = useState(null);
  const [formData, setFormData] = useState({
    type: 'email',
    subject: '',
    content: '',
    communication_date: new Date(),
    follow_up_date: null,
    follow_up_notes: ''
  });
  
  useEffect(() => {
    loadCommunications();
  }, [customerId]);
  
  const loadCommunications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`customers/${customerId}/communications`);
      
      if (response.success) {
        // Sort communications by date (newest first)
        const sortedComms = (response.data || []).sort((a, b) => {
          return new Date(b.communication_date) - new Date(a.communication_date);
        });
        setCommunications(sortedComms);
      } else {
        throw new Error(response.error || 'Failed to load communications');
      }
    } catch (error) {
      debugError('Error loading communications:', error);
      setError(`Failed to load communications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (communication = null) => {
    if (communication) {
      // Edit existing communication
      setCurrentCommunication(communication);
      setFormData({
        type: communication.type || 'email',
        subject: communication.subject || '',
        content: communication.content || '',
        communication_date: new Date(communication.communication_date),
        follow_up_date: communication.follow_up_date ? new Date(communication.follow_up_date) : null,
        follow_up_notes: communication.follow_up_notes || ''
      });
    } else {
      // New communication
      setCurrentCommunication(null);
      setFormData({
        type: 'email',
        subject: '',
        content: '',
        communication_date: new Date(),
        follow_up_date: null,
        follow_up_notes: ''
      });
    }
    
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentCommunication(null);
  };
  
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSaveCommunication = async () => {
    // Validate form data
    if (!formData.type || !formData.subject || !formData.content || !formData.communication_date) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const payload = {
        customer_id: customerId,
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        communication_date: formData.communication_date.toISOString(),
        follow_up_date: formData.follow_up_date ? formData.follow_up_date.toISOString() : null,
        follow_up_notes: formData.follow_up_notes || null
      };
      
      let response;
      
      if (currentCommunication) {
        // Update existing communication
        response = await apiPut(`communications/${currentCommunication.id}`, payload);
      } else {
        // Create new communication
        response = await apiPost(`customers/${customerId}/communications`, payload);
      }
      
      if (response.success) {
        handleCloseDialog();
        loadCommunications();
        if (onCommunicationChange) onCommunicationChange();
      } else {
        throw new Error(response.error || 'Failed to save communication');
      }
    } catch (error) {
      debugError('Error saving communication:', error);
      setError(`Failed to save communication: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCommunication = async (communicationId) => {
    if (!window.confirm('Are you sure you want to delete this communication? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiDelete(`communications/${communicationId}`);
      
      if (response.success) {
        loadCommunications();
        if (onCommunicationChange) onCommunicationChange();
      } else {
        throw new Error(response.error || 'Failed to delete communication');
      }
    } catch (error) {
      debugError('Error deleting communication:', error);
      setError(`Failed to delete communication: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Helper function to get color for communication type
  const getCommunicationTypeColor = (type) => {
    switch (type) {
      case 'email':
        return 'primary';
      case 'phone':
        return 'success';
      case 'in_person':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Helper function to get icon for communication type
  const getCommunicationTypeIcon = (type) => {
    const commType = COMMUNICATION_TYPES.find(t => t.value === type);
    return commType ? commType.icon : <EventIcon fontSize="small" />;
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Communication History</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Communication
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !communications.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : communications.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No communication records found for this customer.
          </Typography>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 1 }}
          >
            Add First Communication
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell width="15%">Date</TableCell>
                <TableCell width="15%">Type</TableCell>
                <TableCell width="25%">Subject</TableCell>
                <TableCell width="25%">Content</TableCell>
                <TableCell width="20%">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {communications.map((comm) => (
                <TableRow key={comm.id} hover>
                  <TableCell>{formatDate(comm.communication_date)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getCommunicationTypeIcon(comm.type)}
                      label={comm.type}
                      color={getCommunicationTypeColor(comm.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{comm.subject}</TableCell>
                  <TableCell sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={comm.content}>
                      <span>{comm.content}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(comm)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCommunication(comm.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Communication Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentCommunication ? 'Edit Communication' : 'Add Communication'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Communication Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    label="Communication Type"
                  >
                    {COMMUNICATION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {type.icon}
                          <Box sx={{ ml: 1 }}>{type.label}</Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Communication Date"
                    value={formData.communication_date}
                    onChange={(newValue) => handleDateChange('communication_date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="subject"
                  label="Subject"
                  fullWidth
                  value={formData.subject}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="content"
                  label="Content"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.content}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Follow-up Information (Optional)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Follow-up Date"
                    value={formData.follow_up_date}
                    onChange={(newValue) => handleDateChange('follow_up_date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    clearable
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="follow_up_notes"
                  label="Follow-up Notes"
                  fullWidth
                  value={formData.follow_up_notes || ''}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCommunication}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Define PropTypes for the component
CustomerCommunications.propTypes = {
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  customerName: PropTypes.string,
  onCommunicationChange: PropTypes.func
};

export default CustomerCommunications;
