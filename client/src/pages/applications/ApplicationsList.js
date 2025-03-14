import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { debugLog, debugError } from '../../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';
import { showSuccess, showError } from '../../utils/notifications';

// Status chip colors
const statusColors = {
  new: 'primary',
  reviewing: 'secondary',
  approved: 'success',
  rejected: 'error',
  pending: 'warning'
};

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusUpdateValue, setStatusUpdateValue] = useState('');
  
  // Load applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Get forms first
        const formsResponse = await apiGet('/application-forms/');
        debugLog('Fetched application forms:', formsResponse);
        setForms(formsResponse);
        
        // Then get submissions
        const submissionsResponse = await apiGet('/form-submissions/');
        debugLog('Fetched form submissions:', submissionsResponse);
        setApplications(submissionsResponse);
      } catch (error) {
        debugError('Error fetching applications:', error);
        showError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);
  
  // View application details
  const handleViewApplication = async (applicationId) => {
    try {
      const response = await apiGet(`/form-submissions/${applicationId}`);
      debugLog('Fetched application details:', response);
      
      setSelectedApplication(response);
      setDialogOpen(true);
      setStatusUpdateValue(response.status);
    } catch (error) {
      debugError('Error fetching application details:', error);
      showError('Failed to load application details');
    }
  };
  
  // Close application dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Update application status
  const handleUpdateStatus = async () => {
    try {
      const response = await apiPut(`/form-submissions/${selectedApplication.id}`, {
        status: statusUpdateValue
      });
      
      debugLog('Updated application status:', response);
      
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
      
      showSuccess('Application status updated successfully');
    } catch (error) {
      debugError('Error updating application status:', error);
      showError('Failed to update application status');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Get form name by ID
  const getFormName = (formId) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.name : `Form #${formId}`;
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Applications</Typography>
        <Button
          component={Link}
          to="/applications/forms"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Manage Forms
        </Button>
      </Box>
      
      {applications.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            No applications have been submitted yet.
          </Typography>
          <Button
            component={Link}
            to="/applications/forms"
            variant="outlined"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
          >
            Create Application Form
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    {application.applicant_name || 'Anonymous'}
                  </TableCell>
                  <TableCell>{getFormName(application.form_id)}</TableCell>
                  <TableCell>{formatDate(application.submission_date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status} 
                      color={statusColors[application.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      onClick={() => handleViewApplication(application.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Application Details Dialog */}
      {selectedApplication && (
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Application from {selectedApplication.applicant_name || 'Anonymous'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Form</Typography>
              <Typography variant="body1">
                {getFormName(selectedApplication.form_id)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Submitted On</Typography>
              <Typography variant="body1">
                {formatDate(selectedApplication.submission_date)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
              <Typography variant="body1">
                {selectedApplication.applicant_email && (
                  <>Email: {selectedApplication.applicant_email}<br /></>
                )}
                {selectedApplication.applicant_phone && (
                  <>Phone: {selectedApplication.applicant_phone}<br /></>
                )}
                {selectedApplication.applicant_address && (
                  <>Address: {selectedApplication.applicant_address}</>
                )}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Responses</Typography>
              {selectedApplication.responses && Object.entries(selectedApplication.responses).map(([question, answer]) => (
                <Box key={question} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">{question}</Typography>
                  <Typography variant="body1">{answer}</Typography>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Notes</Typography>
              <Typography variant="body1">
                {selectedApplication.notes || 'No notes added yet.'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Status</Typography>
              <FormControl fullWidth>
                <Select
                  value={statusUpdateValue}
                  onChange={(e) => setStatusUpdateValue(e.target.value)}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="reviewing">Reviewing</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="pending">Pending More Information</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button 
              onClick={handleUpdateStatus} 
              variant="contained" 
              color="primary"
              disabled={statusUpdateValue === selectedApplication.status}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ApplicationsList;
