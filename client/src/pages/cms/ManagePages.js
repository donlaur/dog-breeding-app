import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, 
  Grid, TextField, InputAdornment, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

// This is a placeholder component for the ManagePages CMS page
const ManagePages = () => {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // This would fetch pages data in a real implementation
    setLoading(true);
    setTimeout(() => {
      setPages([
        { id: 1, title: 'Home Page', slug: 'home', status: 'published', last_updated: '2023-01-01' },
        { id: 2, title: 'About Us', slug: 'about', status: 'published', last_updated: '2023-01-15' },
        { id: 3, title: 'Contact', slug: 'contact', status: 'draft', last_updated: '2023-02-10' }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Manage Pages
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              component={Link}
              to="/dashboard/cms/pages/add"
            >
              Add Page
            </Button>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search pages..."
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
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.length > 0 ? (
                  pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>{page.title}</TableCell>
                      <TableCell>{page.slug}</TableCell>
                      <TableCell>
                        <Chip 
                          label={page.status} 
                          color={page.status === 'published' ? 'success' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{page.last_updated}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          component={Link} 
                          to={`/dashboard/cms/pages/edit/${page.id}`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          component={Link} 
                          to={`/dashboard/cms/pages/preview/${page.id}`}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No pages found. Create your first page to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default ManagePages;
