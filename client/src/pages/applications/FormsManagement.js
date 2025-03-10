import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, IconButton, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, CircularProgress, Switch, 
  FormControlLabel, Tooltip, Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { apiGet, apiPut, apiDelete, apiPost } from '../../utils/apiUtils';

const FormsManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    formId: null,
    formName: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    fetchForms();
  }, []);
  
  const fetchForms = async () => {
    try {
      setLoading(true);
      console.log('Fetching application forms...');
      const result = await apiGet('application-forms');
      console.log('API response:', result);
      
      if (result.ok && result.data) {
        // Handle different response structures
        if (Array.isArray(result.data)) {
          setForms(result.data);
        } else if (result.data.data && Array.isArray(result.data.data)) {
          setForms(result.data.data);
        } else {
          console.warn('Unexpected data format:', result.data);
          setForms([]);
        }
      } else {
        throw new Error(result.error || 'Failed to load forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load forms',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleActive = async (formId, currentStatus) => {
    try {
      console.log(`Toggling form ${formId} active status from ${currentStatus} to ${!currentStatus}`);
      
      // Form ID should be an integer, no need to validate UUID format
      if (!formId) {
        throw new Error('Invalid form ID');
      }
      
      const result = await apiPut(`application-forms/${formId}`, {
        is_active: !currentStatus
      });
      
      console.log('Toggle result:', result);
      
      if (result.ok) {
        // Update forms list
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { ...form, is_active: !currentStatus } 
              : form
          )
        );
        
        setSnackbar({
          open: true,
          message: `Form is now ${!currentStatus ? 'active' : 'inactive'}`,
          severity: 'success'
        });
      } else {
        throw new Error(result.error || 'Failed to update form status');
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update form status: ' + error.message,
        severity: 'error'
      });
    }
  };
  
  const handleDeleteForm = async (formId) => {
    try {
      setLoading(true);
      
      // Convert formId to integer to ensure proper handling
      const response = await apiDelete(`application-forms/${parseInt(formId)}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete form');
      }
      
      // Refresh the forms list
      fetchForms();
      
      setSnackbar({
        open: true,
        message: 'Form deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to delete form'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDuplicateForm = async (formId) => {
    try {
      setLoading(true);
      
      // Fetch the form to duplicate
      const response = await apiGet(`application-forms/${formId}`);
      
      if (!response.ok || !response.data) {
        throw new Error('Failed to fetch form data');
      }
      
      const formData = response.data.form;
      const questionsData = response.data.questions;
      
      // Create a new form with the same data but a different name
      const newFormData = {
        name: `${formData.name} (Copy)`,
        description: formData.description,
        is_active: formData.is_active,
        questions: questionsData.map(q => {
          // Remove the id from each question so new ones will be created
          const { id, created_at, updated_at, ...questionData } = q;
          return questionData;
        })
      };
      
      // Create the new form
      const createResponse = await apiPost('application-forms', newFormData);
      
      if (!createResponse.ok) {
        throw new Error('Failed to duplicate form');
      }
      
      // Refresh the forms list
      fetchForms();
      
      setSnackbar({
        open: true,
        message: 'Form duplicated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error duplicating form:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to duplicate form'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openDeleteDialog = (formId, formName) => {
    setDeleteDialog({
      open: true,
      formId,
      formName
    });
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      formId: null,
      formName: ''
    });
  };
  
  const handleCopyFormLink = (formId) => {
    const formLink = `${window.location.origin}/apply/${formId}`;
    navigator.clipboard.writeText(formLink)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Form link copied to clipboard',
          severity: 'success'
        });
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setSnackbar({
          open: true,
          message: 'Failed to copy link to clipboard',
          severity: 'error'
        });
      });
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
        <Typography variant="h4">Application Forms</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          to="/dashboard/applications/forms/new"
        >
          Create New Form
        </Button>
      </Box>
      
      {forms.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Form Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <Typography variant="body1">{form.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {form.description && form.description.substring(0, 60)}
                      {form.description && form.description.length > 60 ? '...' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.is_active}
                          onChange={() => handleToggleActive(form.id, form.is_active)}
                          color="primary"
                        />
                      }
                      label={form.is_active ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(form.created_at)}</TableCell>
                  <TableCell>
                    {/* This would need a query to get question count */}
                    <Button 
                      component={Link}
                      to={`/dashboard/applications/forms/edit?id=${form.id}`}
                      size="small"
                      variant="text"
                    >
                      View Questions
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end">
                      <Tooltip title="Copy Form Link">
                        <IconButton 
                          size="small"
                          onClick={() => handleCopyFormLink(form.id)}
                        >
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Preview Form">
                        <IconButton 
                          size="small"
                          component={Link}
                          to={`/apply/${form.id}`}
                          target="_blank"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit Form">
                        <IconButton 
                          size="small"
                          component={Link}
                          to={`/dashboard/applications/forms/edit?id=${form.id}`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Duplicate Form">
                        <IconButton 
                          size="small"
                          onClick={() => handleDuplicateForm(form.id)}
                        >
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete Form">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(form.id, form.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            You haven't created any application forms yet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/applications/forms/new"
          >
            Create Your First Form
          </Button>
        </Paper>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the form "{deleteDialog.formName}"? This will also delete all questions and submissions associated with this form. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={() => handleDeleteForm(deleteDialog.formId)} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FormsManagement;