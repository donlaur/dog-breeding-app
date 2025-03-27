import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Alert,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PhotoLibrary as PhotoIcon,
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../utils/apiUtils';
import SimpleFileUpload from '../components/SimpleFileUpload';

const MediaLibrary = () => {
  const [activeTab, setActiveTab] = useState('photos');
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadEntityType, setUploadEntityType] = useState('dog');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Entity lists for selection
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [puppies, setPuppies] = useState([]);
  
  useEffect(() => {
    fetchEntities();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'photos') {
      fetchAllPhotos();
    } else if (activeTab === 'documents') {
      fetchAllDocuments();
    }
  }, [activeTab]);
  
  const fetchEntities = async () => {
    try {
      // Use the proper API paths - avoid duplicate /api prefix since API_URL already has it
      const [dogsRes, littersRes, puppiesRes] = await Promise.all([
        fetch('/api/dogs/'),
        fetch('/api/litters/'),
        fetch('/api/puppies/')
      ]);
      
      if (dogsRes.ok) {
        const dogsData = await dogsRes.json();
        setDogs(dogsData);
      }
      
      if (littersRes.ok) {
        const littersData = await littersRes.json();
        setLitters(littersData);
      }
      
      if (puppiesRes.ok) {
        const puppiesData = await puppiesRes.json();
        setPuppies(puppiesData);
      }
    } catch (err) {
      console.error('Error fetching entities:', err);
    }
  };
  
  const fetchAllPhotos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if the /api/uploads endpoint is available (this would return a file listing)
      const apiBaseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
      
      // Call the API to get all uploads
      // Try both endpoints for compatibility - the direct server endpoint or via API
      let response;
      try {
        console.log('Attempting to fetch uploads via Flask API endpoint');
        response = await fetch(`${apiBaseUrl}/api/uploads`);
      } catch (err) {
        console.error('Error fetching from /api/uploads:', err);
        console.log('Attempting to fetch via direct upload listing as fallback');
        // Use the direct Flask route for testing
        response = await fetch(`${apiBaseUrl}/uploads`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.status}`);
      }
      
      const filesData = await response.json();
      console.log('Files from server:', filesData);

      // Create a simple photo array with URLs
      const photosList = (filesData?.files || []).filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.gif')
      ).map(file => {
        // Properly format URL
        const url = `${apiBaseUrl}/uploads/${file}`;
        console.log(`Created image URL for ${file}: ${url}`);
        
        return {
          id: file.replace(/\.[^/.]+$/, ""), // Remove extension to create an ID
          url: url, 
          original_filename: file,
          created_at: new Date().toISOString() // We don't have this info, use current date
        };
      });
      
      // Sort by filename (as a proxy for date, since newer files likely have higher IDs)
      photosList.sort((a, b) => b.original_filename.localeCompare(a.original_filename));
      
      setPhotos(photosList);
    } catch (err) {
      console.error('Error fetching photos:', err);
      
      // Fallback: try to display a few sample images we know might exist
      try {
        const apiBaseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
        const knownFiles = [
          "ea5d2b49f4eb4c1ba017b18e0dbb80a9.jpeg",
          "445d582ee32d4d1e8532311a7c543543.jpeg",
          "aeb10c03becf4fb4aacfdc58f3ace75f.jpeg"
        ];
        
        const fallbackPhotos = knownFiles.map(file => ({
          id: file.replace(/\.[^/.]+$/, ""),
          url: `${apiBaseUrl}/uploads/${file}`,
          original_filename: file,
          created_at: new Date().toISOString()
        }));
        
        setPhotos(fallbackPhotos);
        setError('Using fallback photo list. Actual photo listing failed: ' + err.message);
      } catch (fallbackErr) {
        setError('Failed to fetch photos: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPhotosForEntityType = async (entityType) => {
    try {
      // Get all entities of this type
      let entities = [];
      if (entityType === 'dog') entities = dogs;
      else if (entityType === 'litter') entities = litters;
      else if (entityType === 'puppy') entities = puppies;
      
      // For each entity, fetch its photos
      const photosPromises = entities.map(entity => 
        apiGet(`${API_URL}/photos/${entityType}/${entity.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(photos => photos.map(photo => ({
            ...photo,
            entityName: getEntityName(entityType, entity)
          })))
          .catch(() => [])
      );
      
      const photosByEntity = await Promise.all(photosPromises);
      return photosByEntity.flat();
    } catch (err) {
      console.error(`Error fetching ${entityType} photos:`, err);
      return [];
    }
  };
  
  const fetchAllDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch documents for different entity types concurrently
      const [dogDocs, litterDocs, puppyDocs] = await Promise.all([
        fetchDocumentsForEntityType('dog'),
        fetchDocumentsForEntityType('litter'),
        fetchDocumentsForEntityType('puppy')
      ]);
      
      // Combine all documents
      const allDocuments = [...dogDocs, ...litterDocs, ...puppyDocs];
      
      // Sort by created date (newest first)
      allDocuments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setDocuments(allDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDocumentsForEntityType = async (entityType) => {
    try {
      // Get all entities of this type
      let entities = [];
      if (entityType === 'dog') entities = dogs;
      else if (entityType === 'litter') entities = litters;
      else if (entityType === 'puppy') entities = puppies;
      
      // For each entity, fetch its documents
      const docsPromises = entities.map(entity => 
        apiGet(`${API_URL}/files/documents/${entityType}/${entity.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(docs => docs.map(doc => ({
            ...doc,
            entityName: getEntityName(entityType, entity)
          })))
          .catch(() => [])
      );
      
      const docsByEntity = await Promise.all(docsPromises);
      return docsByEntity.flat();
    } catch (err) {
      console.error(`Error fetching ${entityType} documents:`, err);
      return [];
    }
  };
  
  const getEntityName = (entityType, entity) => {
    if (entityType === 'dog') {
      return entity.call_name || entity.registered_name || `Dog #${entity.id}`;
    } else if (entityType === 'litter') {
      return entity.litter_name || `Litter #${entity.id}`;
    } else if (entityType === 'puppy') {
      return entity.name || `Puppy #${entity.id}`;
    }
    return 'Unknown';
  };
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null); // No preview for non-image files
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !uploadEntityType || !uploadEntityId) {
      setUploadError('Please select a file, entity type, and entity ID');
      return;
    }
    
    setUploadingFile(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', uploadEntityType);
      formData.append('entity_id', uploadEntityId);
      
      if (uploadType === 'photo') {
        formData.append('caption', uploadCaption);
        // Don't automatically set is_cover to false, let the server determine if it should be a cover
        // This way, if it's the first photo, it will be the cover, and if not, the cover won't change
        
        // Upload to photos endpoint
        const response = await apiUpload(`${API_URL}/photos/`, formData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload photo');
        }
      } else {
        formData.append('title', uploadTitle);
        formData.append('description', uploadDescription);
        
        // Upload to files endpoint
        const response = await apiUpload(`${API_URL}/files/`, formData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload document');
        }
      }
      
      // Refresh the current tab
      if (uploadType === 'photo') {
        fetchAllPhotos();
      } else {
        fetchAllDocuments();
      }
      
      // Show success message and reset form
      setSuccess(`${uploadType === 'photo' ? 'Photo' : 'Document'} uploaded successfully`);
      setTimeout(() => setSuccess(null), 5000);
      
      setUploadDialogOpen(false);
      resetUploadForm();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };
  
  const resetUploadForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCaption('');
    setUploadError(null);
  };
  
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await apiDelete(`${API_URL}/photos/${photoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      // Remove from local state
      setPhotos(photos.filter(photo => photo.id !== photoId));
      
      // Show success message
      setSuccess('Photo deleted successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };
  
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await apiDelete(`${API_URL}/files/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Remove from local state
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      // Show success message
      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };
  
  // Get file extension from URL
  const getFileExtension = (url) => {
    if (!url) return '';
    const parts = url.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : '';
  };
  
  // Get document icon by file type
  const getDocumentIcon = (url) => {
    const ext = getFileExtension(url).toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return '📊';
      case 'txt':
        return '📋';
      default:
        return '📎';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Media Library
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            value="photos" 
            label="Photos" 
            icon={<PhotoIcon />}
            iconPosition="start"
          />
          <Tab 
            value="documents" 
            label="Documents" 
            icon={<DocumentIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchAllPhotos();
          }}
        >
          Refresh Images
        </Button>
        
        {activeTab === 'photos' && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload New Photo
          </Button>
        )}
        {activeTab === 'documents' && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => {
              setUploadType('document');
              setUploadDialogOpen(true);
            }}
          >
            Upload Document
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 'photos' ? (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
          {photos.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No photos found. Upload some photos to get started.
              </Paper>
            </Grid>
          ) : (
            photos.map(photo => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={photo.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    },
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={photo.url}
                      alt={photo.caption || 'Photo'}
                      sx={{ 
                        objectFit: 'cover',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', photo.url);
                        // Set fallback image
                        e.target.src = '/images/dog-paw-print.svg';
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      <IconButton
                        color="default"
                        component="a"
                        href={photo.url}
                        target="_blank"
                        size="large"
                        sx={{ 
                          bgcolor: 'white', 
                          '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' } 
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {photo.original_filename || 'Unnamed photo'}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ p: 1, pt: 0, justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => handleDeletePhoto(photo.id)}
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {documents.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No documents found. Upload some documents to get started.
              </Paper>
            </Grid>
          ) : (
            documents.map(doc => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h1" sx={{ mr: 2, opacity: 0.7 }}>
                        {getDocumentIcon(doc.url)}
                      </Typography>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {doc.title || doc.original_filename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getFileExtension(doc.url)} • Added on {new Date(doc.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {doc.description && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {doc.description}
                      </Typography>
                    )}
                    
                    <Chip
                      size="small"
                      label={`${doc.related_type}: ${doc.entityName}`}
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                  <CardActions>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteDocument(doc.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      component="a"
                      href={doc.url}
                      download={doc.original_filename}
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      color="info"
                      component="a"
                      href={doc.url}
                      target="_blank"
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      
      {/* Upload Dialog - Mobile Friendly */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
            height: { xs: '100%', sm: 'auto' }
          }
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: { xs: 'flex-end', sm: 'center' }
          }
        }}
      >
        <DialogTitle sx={{ 
          p: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="div">
            Upload New Image
          </Typography>
          <IconButton 
            onClick={() => setUploadDialogOpen(false)}
            size="small"
            edge="end"
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <SimpleFileUpload 
            onSuccess={(photoData) => {
              console.log('Upload success:', photoData);
              // Add the new photo to the photos array
              const newPhoto = {
                id: Date.now().toString(),
                url: photoData.url,
                original_filename: photoData.original_filename,
                created_at: new Date().toISOString()
              };
              
              setPhotos([newPhoto, ...photos]);
              setUploadDialogOpen(false);
              setSuccess('Photo uploaded successfully!');
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MediaLibrary;