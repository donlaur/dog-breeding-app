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
  Visibility as ViewIcon
} from '@mui/icons-material';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiDelete } from '../utils/apiUtils';

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
      const [dogsResponse, littersResponse, puppiesResponse] = await Promise.all([
        apiGet('dogs'),
        apiGet('litters'),
        apiGet('puppies')
      ]);
      
      if (dogsResponse.ok) {
        setDogs(dogsResponse.data);
      }
      
      if (littersResponse.ok) {
        setLitters(littersResponse.data);
      }
      
      if (puppiesResponse.ok) {
        setPuppies(puppiesResponse.data);
      }
    } catch (error) {
      debugError("Error fetching entities:", error);
      setError("Failed to load entities");
    }
  };
  
  const fetchAllPhotos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch photos for different entity types concurrently
      const [dogPhotos, litterPhotos, puppyPhotos] = await Promise.all([
        fetchPhotosForEntityType('dog'),
        fetchPhotosForEntityType('litter'),
        fetchPhotosForEntityType('puppy')
      ]);
      
      // Combine all photos
      const allPhotos = [...dogPhotos, ...litterPhotos, ...puppyPhotos];
      
      // Sort by created date (newest first)
      allPhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setPhotos(allPhotos);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to fetch photos. Please try again later.');
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
        apiGet(`photos/${entityType}/${entity.id}`)
          .then(response => response.ok ? response.data : [])
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
        apiGet(`files/documents/${entityType}/${entity.id}`)
          .then(response => response.ok ? response.data : [])
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
        
        // Upload to photos endpoint
        const response = await apiPost('photos/', formData, true);
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to upload photo');
        }
      } else {
        formData.append('title', uploadTitle);
        formData.append('description', uploadDescription);
        
        // Upload to files endpoint
        const response = await apiPost('files/', formData, true);
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to upload document');
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
      setLoading(true);
      
      const response = await apiDelete(`photos/${photoId}`);
      
      if (response.ok) {
        // Refresh photos
        fetchAllPhotos();
        setSuccess("Photo deleted successfully");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(response.error || "Failed to delete photo");
      }
    } catch (error) {
      debugError("Error deleting photo:", error);
      setError(`Failed to delete photo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await apiDelete(`files/documents/${documentId}`);
      
      if (response.ok) {
        // Refresh documents
        fetchAllDocuments();
        setSuccess("Document deleted successfully");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(response.error || "Failed to delete document");
      }
    } catch (error) {
      debugError("Error deleting document:", error);
      setError(`Failed to delete document: ${error.message}`);
    } finally {
      setLoading(false);
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
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => {
            setUploadType(activeTab === 'photos' ? 'photo' : 'document');
            setUploadDialogOpen(true);
          }}
        >
          Upload {activeTab === 'photos' ? 'Photo' : 'Document'}
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 'photos' ? (
        <Grid container spacing={3}>
          {photos.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                No photos found. Upload some photos to get started.
              </Paper>
            </Grid>
          ) : (
            photos.map(photo => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.url}
                    alt={photo.caption || 'Photo'}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ pb: 1 }}>
                    {photo.caption && (
                      <Typography variant="body2" gutterBottom>
                        {photo.caption}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${photo.related_type}: ${photo.entityName}`}
                        color="primary"
                        variant="outlined"
                      />
                      {photo.is_cover && (
                        <Chip size="small" label="Cover" color="secondary" />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      color="error"
                      onClick={() => handleDeletePhoto(photo.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      component="a"
                      href={photo.url}
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
      
      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload {uploadType === 'photo' ? 'Photo' : 'Document'}
        </DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Box sx={{ my: 2 }}>
            <input
              accept={uploadType === 'photo' ? "image/*" : "*/*"}
              style={{ display: 'none' }}
              id="upload-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="upload-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Select {uploadType === 'photo' ? 'Photo' : 'Document'}
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Selected: {selectedFile.name}
                </Typography>
              </Box>
            )}
            
            {filePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={filePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={uploadEntityType}
                  onChange={(e) => setUploadEntityType(e.target.value)}
                  label="Entity Type"
                >
                  <MenuItem value="dog">Dog</MenuItem>
                  <MenuItem value="litter">Litter</MenuItem>
                  <MenuItem value="puppy">Puppy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entity</InputLabel>
                <Select
                  value={uploadEntityId}
                  onChange={(e) => setUploadEntityId(e.target.value)}
                  label="Entity"
                >
                  {uploadEntityType === 'dog' ? (
                    dogs.map(dog => (
                      <MenuItem key={dog.id} value={dog.id}>
                        {dog.call_name || dog.registered_name || `Dog #${dog.id}`}
                      </MenuItem>
                    ))
                  ) : uploadEntityType === 'litter' ? (
                    litters.map(litter => (
                      <MenuItem key={litter.id} value={litter.id}>
                        {litter.litter_name || `Litter #${litter.id}`}
                      </MenuItem>
                    ))
                  ) : (
                    puppies.map(puppy => (
                      <MenuItem key={puppy.id} value={puppy.id}>
                        {puppy.name || `Puppy #${puppy.id}`}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            {uploadType === 'photo' ? (
              <Grid item xs={12}>
                <TextField
                  label="Caption (optional)"
                  fullWidth
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Title"
                    fullWidth
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description (optional)"
                    fullWidth
                    multiline
                    rows={3}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploadingFile}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !uploadEntityType || !uploadEntityId || uploadingFile}
            startIcon={uploadingFile ? <CircularProgress size={20} /> : null}
          >
            {uploadingFile ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaLibrary;