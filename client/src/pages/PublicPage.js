import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PageContext';

// Template components - placeholder fallbacks for when imports fail
const DefaultTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

const AboutTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

const ContactTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

const DogsTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

const PuppiesTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

const FaqTemplate = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
);

// Template components
const templates = {
  default: DefaultTemplate,
  about: AboutTemplate,
  contact: ContactTemplate,
  dogs: DogsTemplate,
  puppies: PuppiesTemplate,
  faq: FaqTemplate
};

const PublicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { fetchPageBySlug } = usePages();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageData = await fetchPageBySlug(slug);
        if (pageData) {
          // Check if page is published
          if (pageData.status === 'draft') {
            // Navigate to 404 or homepage if page is draft
            navigate('/');
            return;
          }
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
  }, [slug, fetchPageBySlug, navigate]);

  // Function to render content based on template
  const renderPageContent = () => {
    if (!page) return null;
    
    const template = page.template || 'default';
    const TemplateComponent = templates[template] || templates.default;
    
    return <TemplateComponent content={page.content} page={page} />;
  };

  // Set the page title and meta description
  useEffect(() => {
    if (page) {
      document.title = `${page.title} | Dog Breeding App`;
      
      // Update meta description if provided
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && page.meta_description) {
        metaDescription.setAttribute('content', page.meta_description);
      }
    }
    
    // Reset when component unmounts
    return () => {
      document.title = 'Dog Breeding App';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Dog Breeding Application');
      }
    };
  }, [page]);

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
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
            {page.title}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box className="page-content">
            {renderPageContent()}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PublicPage;