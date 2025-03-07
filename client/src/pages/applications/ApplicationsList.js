import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, CircularProgress, Tabs, Tab, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Status chip colors
const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  waitlist: 'info'
};

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusUpdateValue, setStatusUpdateValue] = useState('');
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Get forms first
        const formsResponse = await axios.get('/api/application-forms');
        if (formsResponse.data.success) {
          setForms(formsResponse.data.data);
        }
        
        // Then get submissions
        const submissionsResponse = await axios.get('/api/form-submissions');
        if (submissionsResponse.data.success) {
          setApplications(submissionsResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);
  
  const handleViewApplication = async (applicationId) => {
    try {
      const response = await axios.get(`/api/form-submissions/${applicationId}`);
      if (response.data.success) {
        setSelectedApplication(response.data.data);
        setDialogOpen(true);
        setStatusUpdateValue(response.data.data.status);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedApplication(null);
  };
  
  const handleUpdateStatus = async () => {
    try {
      const response = await axios.put(`/api/form-submissions/${selectedApplication.id}/status`, {
        status: statusUpdateValue
      });
      
      if (response.data.success) {
        // Update the application in the list
        setApplications(prevApps => 
          prevApps.map(app => 
            app.id === selectedApplication.id 
              ? { ...app, status: statusUpdateValue } 
              : app
          )
        );
        
        // Update the selected application
        setSelectedApplication(prev => ({
          ...prev,
          status: statusUpdateValue
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  // Apply filters
  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesForm = formFilter === 'all' || app.form_id === formFilter;
    return matchesStatus && matchesForm;
  });
  
  // Find form name by ID
  const getFormName = (formId) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.name : 'Unknown Form';
  };
  
  // Format date string
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Application Submissions</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          to="/applications/forms/new"
        >
          Create New Form
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="waitlist">Waitlist</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="form-filter-label">Form</InputLabel>
            <Select
              labelId="form-filter-label"
              value={formFilter}
              label="Form"
              onChange={(e) => setFormFilter(e.target.value)}
            >
              <MenuItem value="all">All Forms</MenuItem>
              {forms.map(form => (
                <MenuItem key={form.id} value={form.id}>
                  {form.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {filteredApplications.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Typography variant="body1">{application.applicant_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{application.applicant_email}</Typography>
                  </TableCell>
                  <TableCell>{getFormName(application.form_id)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status.charAt(0).toUpperCase() + application.status.slice(1)} 
                      color={statusColors[application.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(application.created_at)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewApplication(application.id)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No applications found matching the current filters.
          </Typography>
        </Paper>
      )}
      
      {selectedApplication && (
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Application from {selectedApplication.applicant_name}
          </DialogTitle>
          
          <DialogContent dividers>
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>Applicant Information</Typography>
              <Box display="grid" gridTemplateColumns="1fr 2fr" gap={2}>
                <Typography variant="body2" color="text.secondary">Name:</Typography>
                <Typography variant="body1">{selectedApplication.applicant_name}</Typography>
                
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body1">{selectedApplication.applicant_email}</Typography>
                
                <Typography variant="body2" color="text.secondary">Phone:</Typography>
                <Typography variant="body1">{selectedApplication.applicant_phone || 'Not provided'}</Typography>
                
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Chip 
                  label={selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)} 
                  color={statusColors[selectedApplication.status] || 'default'}
                  size="small"
                />
                
                <Typography variant="body2" color="text.secondary">Submitted:</Typography>
                <Typography variant="body1">{formatDate(selectedApplication.created_at)}</Typography>
                
                {selectedApplication.puppy && (
                  <>
                    <Typography variant="body2" color="text.secondary">Applied For:</Typography>
                    <Typography variant="body1">
                      Puppy: {selectedApplication.puppy.name} ({selectedApplication.puppy.gender}, {selectedApplication.puppy.color})
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>Application Responses</Typography>
            
            {selectedApplication.responses && selectedApplication.responses.length > 0 ? (
              <Box>
                {selectedApplication.responses.map((response, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{response.question_text || `Question ${index + 1}`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1">
                        {Array.isArray(response.value) 
                          ? response.value.join(', ') 
                          : response.value || 'No answer provided'}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No responses available.
              </Typography>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center">
              <FormControl sx={{ minWidth: 150, mr: 1 }}>
                <InputLabel id="update-status-label">Update Status</InputLabel>
                <Select
                  labelId="update-status-label"
                  value={statusUpdateValue}
                  label="Update Status"
                  onChange={(e) => setStatusUpdateValue(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="waitlist">Waitlist</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                onClick={handleUpdateStatus}
                disabled={statusUpdateValue === selectedApplication.status}
              >
                Update
              </Button>
            </Box>
            
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default ApplicationsList;