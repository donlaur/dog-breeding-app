import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link, useParams } from 'react-router-dom';
import { usePages } from '../../context/PageContext';
import ShortcodeRenderer from '../../utils/shortcodeProcessor';

// Helpers for shortcode documentation
const ShortcodeDocumentation = () => (
  <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
    <Typography variant="h6" gutterBottom>
      Available Shortcodes
    </Typography>
    <Typography variant="body2" paragraph>
      Use these shortcodes in your page content to display dynamic data.
    </Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              [DisplayDogs]
            </Typography>
            <Typography variant="body2">
              Display grid of dogs with optional filters:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1 }}>
              [DisplayDogs gender=Male breed="Golden Retriever"]
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Parameters: gender, breed, age, status
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              [DisplayDog]
            </Typography>
            <Typography variant="body2">
              Display a single dog by ID:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1 }}>
              [DisplayDog id=1]
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Parameters: id (required)
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              [DisplayLitters]
            </Typography>
            <Typography variant="body2">
              Display litters with optional filters:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1 }}>
              [DisplayLitters status=Available]
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Parameters: status, dam, sire
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              [DisplayPuppies]
            </Typography>
            <Typography variant="body2">
              Display puppies with optional filters:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1 }}>
              [DisplayPuppies status=Available gender=Male]
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Parameters: status, gender, litter
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              [ContactForm]
            </Typography>
            <Typography variant="body2">
              Display a contact form:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1 }}>
              [ContactForm subject="Puppy Inquiry"]
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Parameters: subject, recipient
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

// Enhanced templates for the preview
const templates = {
  default: ({ content }) => <ShortcodeRenderer content={content} />,
  about: ({ content }) => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        About Our Breeding Program
      </Typography>
      <ShortcodeRenderer content={content} />
    </Box>
  ),
  contact: ({ content }) => (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <ShortcodeRenderer content={content} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visit Us
              </Typography>
              <Typography paragraph>
                We're located in a beautiful countryside setting where our dogs have plenty of room to play and exercise.
              </Typography>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 250, 
                  bgcolor: 'grey.200', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Typography color="text.secondary">
                  Map would appear here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  ),
  dogs: ({ content }) => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Our Dogs
      </Typography>
      <Typography variant="body1" paragraph>
        Meet the wonderful dogs that make our breeding program special. We focus on health, temperament, and breed standards.
      </Typography>
      <ShortcodeRenderer content={content} />
    </Box>
  ),
  puppies: ({ content }) => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Available Puppies
      </Typography>
      <Typography variant="body1" paragraph>
        Our puppies are raised with love, early socialization, and the best veterinary care. 
        All puppies come with health guarantees and lifetime breeder support.
      </Typography>
      <ShortcodeRenderer content={content} />
    </Box>
  ),
  faq: ({ content }) => (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Frequently Asked Questions
      </Typography>
      <Typography variant="body1" paragraph>
        Find answers to common questions about our dogs, puppies, and adoption process.
      </Typography>
      <ShortcodeRenderer content={content} />
    </Box>
  ),
};

const PagePreview = () => {
  const { id } = useParams();
  const { fetchPageById } = usePages();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageData = await fetchPageById(id);
        if (pageData) {
          setPage(pageData);
        } else {
          setError('Page not found');
        }
      } catch (err) {
        setError('Failed to load page');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id, fetchPageById]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewPublicPage = () => {
    if (page && page.slug) {
      window.open(`/page/${page.slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              component={Link}
              to="/dashboard/pages"
            >
              Back to Pages
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Page Preview
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              component={Link}
              to="/dashboard/pages"
              sx={{ mr: 2 }}
            >
              Back to Pages
            </Button>
            {page.status === 'published' && (
              <Button 
                variant="outlined" 
                startIcon={<VisibilityIcon />}
                onClick={handleViewPublicPage}
                sx={{ mr: 2 }}
              >
                View Public Page
              </Button>
            )}
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              component={Link}
              to={`/dashboard/pages/edit/${id}`}
            >
              Edit Page
            </Button>
          </Box>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Preview" />
            <Tab label="Details" />
            <Tab label="Shortcodes Help" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box>
              <Paper sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                  {page.title}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box className="page-content">
                  {/* Use the template components for content rendering */}
                  {(() => {
                    const template = page.template || 'default';
                    const TemplateComponent = templates[template] || templates.default;
                    return <TemplateComponent content={page.content} page={page} />;
                  })()}
                </Box>
              </Paper>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={page.status || 'Published'} 
                      color={page.status === 'draft' ? 'default' : 'success'} 
                      size="small" 
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      URL Slug
                    </Typography>
                    <Typography>/{page.slug}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Template
                    </Typography>
                    <Typography>{page.template || 'Default'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography>{formatDate(page.updated_at)}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Show in Menu
                    </Typography>
                    <Typography>{page.show_in_menu ? 'Yes' : 'No'}</Typography>
                  </Box>
                  
                  {page.show_in_menu && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Menu Order
                      </Typography>
                      <Typography>{page.menu_order || 0}</Typography>
                    </Box>
                  )}
                </Grid>
                
                {page.meta_description && (
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Meta Description
                      </Typography>
                      <Typography variant="body2">{page.meta_description}</Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Raw Content
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.100', 
                        borderRadius: 1, 
                        mt: 1,
                        maxHeight: 200,
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.875rem'
                      }}
                    >
                      {page.content}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeTab === 2 && (
            <ShortcodeDocumentation />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PagePreview;