import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link, useNavigate } from 'react-router-dom';
import { usePages } from '../../context/PageContext';

const ManagePages = () => {
  const { pages, loading, error, fetchPages, deletePage } = usePages();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);

  // Only fetch pages on mount, remove fetchPages from dependency array to avoid infinite loop
  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pageToDelete) {
      try {
        await deletePage(pageToDelete.id);
        setDeleteDialogOpen(false);
        setPageToDelete(null);
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Manage Pages
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/pages/add"
          >
            Add New Page
          </Button>
        </Box>
        
        {loading ? (
          <Typography>Loading pages...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : pages.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">No pages found</Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
              Create your first page to display content on your website
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              component={Link}
              to="/dashboard/pages/add"
            >
              Create First Page
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>{page.title}</TableCell>
                    <TableCell>/{page.slug}</TableCell>
                    <TableCell>{page.template || 'Default'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={page.status || 'Published'} 
                        color={page.status === 'draft' ? 'default' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{formatDate(page.updated_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="info" 
                        onClick={() => navigate(`/dashboard/pages/preview/${page.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        onClick={() => navigate(`/dashboard/pages/edit/${page.id}`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(page)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the page "{pageToDelete?.title}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagePages;