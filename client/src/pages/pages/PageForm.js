import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormHelperText,
  Alert,
  Snackbar,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { usePages } from '../../context/PageContext';
import RichTextEditor from '../../components/RichTextEditor';

// Page templates
const PAGE_TEMPLATES = [
  { value: 'default', label: 'Default Template' },
  { value: 'about', label: 'About Us' },
  { value: 'contact', label: 'Contact Page' },
  { value: 'dogs', label: 'Our Dogs' },
  { value: 'puppies', label: 'Available Puppies' },
  { value: 'faq', label: 'FAQ Page' },
];

const PageForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { createPage, updatePage, fetchPageById } = usePages();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    template: 'default',
    status: 'published',
    meta_description: '',
    show_in_menu: false,
    menu_order: 0
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadPage = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          console.log("Fetching page with ID:", id);
          
          // Use the fetchPageById function from context
          const pageData = await fetchPageById(id);
          
          // Check if component is still mounted before updating state
          if (!isMounted) return;
          
          if (pageData) {
            console.log("Found page data:", pageData);
            setFormData({
              title: pageData.title || '',
              slug: pageData.slug || '',
              content: pageData.content || '',
              template: pageData.template || 'default',
              status: pageData.status || 'published',
              meta_description: pageData.meta_description || '',
              show_in_menu: Boolean(pageData.show_in_menu),
              menu_order: pageData.menu_order || 0
            });
          } else {
            console.error("Page not found");
            setError('Page not found');
          }
        } catch (err) {
          console.error('Error loading page:', err);
          if (isMounted) {
            setError('Failed to load page');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadPage();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, fetchPageById]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user makes a change
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleContentChange = (value) => {
    setFormData({
      ...formData,
      content: value
    });
    
    // Clear content error
    if (formErrors.content) {
      setFormErrors({
        ...formErrors,
        content: null
      });
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData, 
      title,
      // Only auto-generate slug if slug is empty or matches the previous auto-generated slug
      slug: !formData.slug || formData.slug === formData.title.toLowerCase().replace(/\s+/g, '-') 
        ? title.toLowerCase().replace(/\s+/g, '-')
        : formData.slug
    });
    
    if (formErrors.title) {
      setFormErrors({
        ...formErrors,
        title: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditMode) {
        await updatePage(id, formData);
      } else {
        await createPage(formData);
      }
      setSuccess(true);
      
      // Navigate back to pages list after a short delay
      setTimeout(() => {
        navigate('/dashboard/pages');
      }, 1500);
    } catch (err) {
      setError('Failed to save page');
      console.error(err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography>Loading page...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success">
          Page {isEditMode ? 'updated' : 'created'} successfully
        </Alert>
      </Snackbar>
      
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Page' : 'Create New Page'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/dashboard/pages"
          >
            Back to Pages
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Content" />
              <Tab label="SEO & Settings" />
            </Tabs>
            
            {activeTab === 0 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Page Title"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      error={Boolean(formErrors.title)}
                      helperText={formErrors.title}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL Slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      error={Boolean(formErrors.slug)}
                      helperText={formErrors.slug || "This will be the URL of your page, e.g. /about-us"}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box>
                      <RichTextEditor
                        label="Page Content"
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Enter your page content here..."
                        error={formErrors.content}
                      />
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Shortcode Tips:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You can use shortcodes to display dynamic content. For example:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem' }}>
                          <li>[DisplayDogs gender=Male] - Show male dogs</li>
                          <li>[DisplayDog id=1] - Show a specific dog</li>
                          <li>[ContactForm subject="Website Inquiry"] - Display a contact form</li>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          See the "Shortcodes Help" tab in the page preview for more options.
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="template-label">Page Template</InputLabel>
                      <Select
                        labelId="template-label"
                        name="template"
                        value={formData.template}
                        label="Page Template"
                        onChange={handleInputChange}
                      >
                        {PAGE_TEMPLATES.map(template => (
                          <MenuItem key={template.value} value={template.value}>
                            {template.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Select the layout template for this page</FormHelperText>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        name="status"
                        value={formData.status}
                        label="Status"
                        onChange={handleInputChange}
                      >
                        <MenuItem value="published">Published</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                      </Select>
                      <FormHelperText>
                        Draft pages are only visible to logged-in breeders
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meta Description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      helperText="Brief description for search engines (recommended: 150-160 characters)"
                    />
                  </Grid>
                  
                  {/* Navigation Menu Settings */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Navigation Menu Settings
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <FormControl component="fieldset">
                            <Typography variant="body2" gutterBottom>
                              Show in Menu
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                name="show_in_menu"
                                checked={formData.show_in_menu}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  show_in_menu: e.target.checked
                                })}
                                style={{ marginRight: '8px' }}
                              />
                              <Typography variant="body2">
                                Display this page in the navigation menu
                              </Typography>
                            </Box>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Menu Order"
                            name="menu_order"
                            type="number"
                            value={formData.menu_order}
                            onChange={handleInputChange}
                            disabled={!formData.show_in_menu}
                            InputProps={{ inputProps: { min: 0 } }}
                            helperText="Lower numbers appear first (0, 1, 2, etc.)"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<SaveIcon />}
            >
              {isEditMode ? 'Update Page' : 'Create Page'}
            </Button>
          </Box>
          
          {/* Shortcodes Reference */}
          <Paper sx={{ mt: 5, p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Available Shortcodes
            </Typography>
            <Typography variant="body2" paragraph>
              You can use these shortcodes in your page content to display dynamic data.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    [DisplayDogs]
                  </Typography>
                  <Typography variant="body2">
                    Display a grid of dogs with optional filters:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1, 
                      fontSize: '0.8rem',
                      overflowX: 'auto'
                    }}
                  >
                    [DisplayDogs gender=Male breed="Golden Retriever"]
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Parameters: gender, breed, age, status
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    [DisplayDog]
                  </Typography>
                  <Typography variant="body2">
                    Display a single dog by ID:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1, 
                      fontSize: '0.8rem',
                      overflowX: 'auto'
                    }}
                  >
                    [DisplayDog id=1]
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Parameters: id (required)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    [DisplayPuppies]
                  </Typography>
                  <Typography variant="body2">
                    Display puppies with optional filters:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1, 
                      fontSize: '0.8rem',
                      overflowX: 'auto'
                    }}
                  >
                    [DisplayPuppies status=Available gender=Male]
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Parameters: status, gender, litter
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    [DisplayLitters]
                  </Typography>
                  <Typography variant="body2">
                    Display litters with optional filters:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1, 
                      fontSize: '0.8rem',
                      overflowX: 'auto'
                    }}
                  >
                    [DisplayLitters status=Available]
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Parameters: status, dam, sire
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    [ContactForm]
                  </Typography>
                  <Typography variant="body2">
                    Display a contact form:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1, 
                      fontSize: '0.8rem',
                      overflowX: 'auto'
                    }}
                  >
                    [ContactForm subject="Puppy Inquiry" recipient="your@email.com"]
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Parameters: subject, recipient
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default PageForm;