import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, 
  Grid, CircularProgress, Divider
} from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { usePages } from '../../context/PageContext';

// This is a placeholder component for the PagePreview
const PagePreview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { getPage } = usePages();
  
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      // If we have page data from the form, use that
      if (location.state?.pageData) {
        setPageData(location.state.pageData);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // In a real implementation, we would fetch the page data
        // const data = await getPage(id);
        
        // For now, use mock data
        const data = {
          title: 'Sample Page',
          slug: 'sample-page',
          content: '<p>This is a sample page content. It would normally be rendered as HTML.</p><p>In a real implementation, this content would be styled and formatted properly.</p>',
          meta_description: 'This is a sample meta description',
          status: 'published',
          is_featured: true,
          created_at: '2023-01-15',
          updated_at: '2023-02-20'
        };
        
        setPageData(data);
      } catch (err) {
        console.error('Error loading page:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id, location.state, getPage]);

  const handleBackToEdit = () => {
    navigate(`/dashboard/cms/pages/edit/${id}`);
  };

  const handleBackToList = () => {
    navigate('/dashboard/cms/pages');
  };

  // Function to safely render HTML content
  const createMarkup = (html) => {
    return { __html: html };
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Preview Header with Actions */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Page Preview
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToList}
              sx={{ mr: 1 }}
            >
              Back to List
            </Button>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={handleBackToEdit}
            >
              Edit Page
            </Button>
          </Box>
        </Box>

        {/* Preview Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Preview Information
              </Typography>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">Title:</Typography>
              <Typography variant="body1">{pageData.title}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">Slug:</Typography>
              <Typography variant="body1">{pageData.slug}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {pageData.status}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Meta Description:</Typography>
              <Typography variant="body1">{pageData.meta_description || 'None'}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Content Preview */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
            Content Preview
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {pageData.title}
            </Typography>
            <Box 
              className="content-preview" 
              dangerouslySetInnerHTML={createMarkup(pageData.content)} 
              sx={{ 
                '& p': { 
                  marginBottom: 2 
                } 
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PagePreview;
