import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, 
  Grid, TextField, FormControl, InputLabel, 
  Select, MenuItem, FormHelperText, Switch,
  FormControlLabel, Snackbar, Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { usePages } from '../../context/PageContext';

// This is a placeholder component for the PageForm (used for add/edit)
const PageForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { getPage, addPage, updatePage } = usePages();
  
  const [loading, setLoading] = useState(isEditing);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    status: 'draft',
    is_featured: false
  });

  const [formErrors, setFormErrors] = useState({
    title: '',
    slug: '',
    content: ''
  });

  useEffect(() => {
    if (isEditing) {
      // Load page data when editing
      const loadPage = async () => {
        try {
          setLoading(true);
          // In a real implementation, we would fetch the page data
          // const pageData = await getPage(id);
          const pageData = {
            title: 'Sample Page',
            slug: 'sample-page',
            content: '<p>This is a sample page content.</p>',
            meta_description: 'This is a sample meta description',
            status: 'published',
            is_featured: true
          };
          setFormData(pageData);
        } catch (err) {
          console.error('Error loading page:', err);
          setError('Failed to load page data');
        } finally {
          setLoading(false);
        }
      };

      loadPage();
    }
  }, [id, isEditing, getPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      title: '',
      slug: '',
      content: ''
    };

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      isValid = false;
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, we would save the page data
      // const result = isEditing 
      //   ? await updatePage(id, formData)
      //   : await addPage(formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/dashboard/cms/pages');
      }, 1500);
    } catch (err) {
      console.error('Error saving page:', err);
      setError('Failed to save page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    
    // In a real implementation, we might save a draft first
    // For now, we'll just navigate to the preview with state
    navigate(`/dashboard/cms/pages/preview/${id || 'new'}`, { state: { pageData: formData } });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Page' : 'Add New Page'}
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Page Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  disabled={loading}
                />
              </Grid>
              
              {/* Slug */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Page Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  error={!!formErrors.slug}
                  helperText={formErrors.slug || 'Used in the URL (e.g. example.com/page/your-slug)'}
                  disabled={loading}
                />
              </Grid>
              
              {/* Content */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Page Content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  error={!!formErrors.content}
                  helperText={formErrors.content}
                  multiline
                  rows={10}
                  disabled={loading}
                />
              </Grid>
              
              {/* Meta Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meta Description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  helperText="Brief description for search engines (recommended)"
                  disabled={loading}
                />
              </Grid>
              
              {/* Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                  <FormHelperText>
                    Draft pages are not visible to the public
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              {/* Featured Toggle */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_featured}
                      onChange={handleSwitchChange}
                      name="is_featured"
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label="Featured Page (show in navigation)"
                />
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard/cms/pages')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  onClick={handlePreview}
                  disabled={loading}
                >
                  Preview
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Page' : 'Create Page')}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
      
      {/* Success Message */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Page {isEditing ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
      
      {/* Error Message */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PageForm;
