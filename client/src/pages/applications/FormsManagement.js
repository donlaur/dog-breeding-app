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
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
      const response = await axios.get('/api/application-forms');
      if (response.data.success) {
        setForms(response.data.data);
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
      const response = await axios.put(`/api/application-forms/${formId}`, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        // Update forms list
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { ...form, is_active: !currentStatus } 
              : form
          )
        );
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update form status',
        severity: 'error'
      });
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
  
  const handleDeleteForm = async () => {
    try {
      const response = await axios.delete(`/api/application-forms/${deleteDialog.formId}`);
      
      if (response.data.success) {
        // Remove from forms list
        setForms(prevForms => prevForms.filter(form => form.id !== deleteDialog.formId));
        
        setSnackbar({
          open: true,
          message: 'Form deleted successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete form',
        severity: 'error'
      });
    } finally {
      closeDeleteDialog();
    }
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
          <Button onClick={handleDeleteForm} color="error">Delete</Button>
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