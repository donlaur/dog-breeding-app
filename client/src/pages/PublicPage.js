import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PageContext';
import ShortcodeRenderer from '../utils/shortcodeProcessor';
import PageNavigation from '../components/PageNavigation';

// Enhanced template components with specific layouts
const DefaultTemplate = ({ content, page }) => (
  <Box>
    <ShortcodeRenderer content={content} />
  </Box>
);

const AboutTemplate = ({ content, page }) => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      About Our Breeding Program
    </Typography>
    <ShortcodeRenderer content={content} />
  </Box>
);

const ContactTemplate = ({ content, page }) => (
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
            {/* This would be replaced with an actual map in production */}
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
);

const DogsTemplate = ({ content, page }) => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      Our Dogs
    </Typography>
    <Typography variant="body1" paragraph>
      Meet the wonderful dogs that make our breeding program special. We focus on health, temperament, and breed standards.
    </Typography>
    <ShortcodeRenderer content={content} />
  </Box>
);

const PuppiesTemplate = ({ content, page }) => (
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
);

const FaqTemplate = ({ content, page }) => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      Frequently Asked Questions
    </Typography>
    <Typography variant="body1" paragraph>
      Find answers to common questions about our dogs, puppies, and adoption process.
    </Typography>
    <ShortcodeRenderer content={content} />
  </Box>
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
    <>
      <PageNavigation />
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
    </>
  );
};

export default PublicPage;