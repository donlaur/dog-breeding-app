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
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { Link, useParams } from 'react-router-dom';
import { usePages } from '../../context/PageContext';

// Import templates
const templates = {
  default: (content) => content,
  about: (content) => content,
  contact: (content) => content,
  dogs: (content) => content,
  puppies: (content) => content,
  faq: (content) => content,
};

const PagePreview = () => {
  const { id } = useParams();
  const { fetchPageById } = usePages();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Function to render content based on template
  const renderPageContent = (page) => {
    const template = page.template || 'default';
    const renderFunction = templates[template] || templates.default;
    return renderFunction(page.content);
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
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography>{formatDate(page.updated_at)}</Typography>
          </Box>
          
          {page.meta_description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Meta Description
              </Typography>
              <Typography variant="body2">{page.meta_description}</Typography>
            </Box>
          )}
        </Paper>
        
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            {page.title}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box className="page-content">
            {/* In a real implementation, you'd use a component to safely render HTML content */}
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PagePreview;