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
  MenuItem,
  FormHelperText
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
import { apiGet, apiPost, apiDelete, sanitizeApiData } from '../utils/apiUtils';
import { 
  sanitizeUserInput, 
  validateFileType, 
  validateFileSize, 
  validateTextLength, 
  formatFileSize 
} from '../utils/inputSanitization';

const MAX_CAPTION_LENGTH = 200;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

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
    setUploadError(null); // Reset any previous errors
    
    // Validate file size
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      setUploadError(`File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }
    
    // Validate file type
    const allowedTypes = uploadType === 'photo' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    if (!validateFileType(file, allowedTypes)) {
      setUploadError(`Invalid file type. Allowed types for ${uploadType}: ${allowedTypes.join(', ')}`);
      return;
    }
    
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
  
  const validateUploadForm = () => {
    // Check required fields
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return false;
    }
    
    if (!uploadEntityType) {
      setUploadError('Please select an entity type');
      return false;
    }
    
    if (!uploadEntityId) {
      setUploadError('Please select an entity');
      return false;
    }
    
    // Validate text fields length
    if (uploadType === 'photo') {
      if (!validateTextLength(uploadCaption, MAX_CAPTION_LENGTH)) {
        setUploadError(`Caption cannot exceed ${MAX_CAPTION_LENGTH} characters`);
        return false;
      }
    } else {
      if (!validateTextLength(uploadTitle, MAX_TITLE_LENGTH)) {
        setUploadError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
        return false;
      }
      
      if (!validateTextLength(uploadDescription, MAX_DESCRIPTION_LENGTH)) {
        setUploadError(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
        return false;
      }
    }
    
    return true;
  };
  
  const handleUpload = async () => {
    // Reset error state
    setUploadError(null);
    
    // Validate form before proceeding
    if (!validateUploadForm()) {
      return;
    }
    
    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', uploadEntityType);
      formData.append('entity_id', uploadEntityId);
      
      if (uploadType === 'photo') {
        // Sanitize user input
        const sanitizedCaption = sanitizeUserInput(uploadCaption);
        formData.append('caption', sanitizedCaption);
        
        // Upload to photos endpoint
        const response = await apiPost('photos/', formData, {
          headers: {
            // Remove Content-Type header so browser can set it with boundary for FormData
            'Content-Type': undefined
          }
        });
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to upload photo');
        }
      } else {
        // Sanitize user input
        const sanitizedTitle = sanitizeUserInput(uploadTitle);
        const sanitizedDescription = sanitizeUserInput(uploadDescription);
        
        formData.append('title', sanitizedTitle);
        formData.append('description', sanitizedDescription);
        
        // Upload to files endpoint
        const response = await apiPost('files/', formData, {
          headers: {
            // Remove Content-Type header so browser can set it with boundary for FormData
            'Content-Type': undefined
          }
        });
        
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
      debugError('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const renderUploadDialog = () => (
    <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload {uploadType === 'photo' ? 'Photo' : 'Document'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  cursor: 'pointer',
                  bgcolor: 'background.default'
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                {filePreview ? (
                  <Box sx={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </Box>
                ) : (
                  <>
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="textSecondary">
                      Click to select a {uploadType === 'photo' ? 'photo' : 'document'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Max size: {formatFileSize(MAX_FILE_SIZE)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Allowed formats: {uploadType === 'photo' 
                      ? 'JPG, PNG, GIF, WebP' 
                      : 'PDF, DOC, DOCX, TXT, XLS, XLSX'}
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  id="file-upload"
                  accept={uploadType === 'photo' 
                    ? 'image/jpeg, image/png, image/gif, image/webp' 
                    : '.pdf,.doc,.docx,.txt,.xls,.xlsx'
                  }
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </Paper>
              {selectedFile && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth required>
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
                
                <FormControl fullWidth required>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    value={uploadEntityId}
                    onChange={(e) => setUploadEntityId(e.target.value)}
                    label="Entity"
                    disabled={!uploadEntityType}
                  >
                    {uploadEntityType === 'dog' && dogs.map(dog => (
                      <MenuItem key={dog.id} value={dog.id}>
                        {dog.call_name || dog.registered_name || `Dog #${dog.id}`}
                      </MenuItem>
                    ))}
                    {uploadEntityType === 'litter' && litters.map(litter => (
                      <MenuItem key={litter.id} value={litter.id}>
                        {litter.litter_name || `Litter #${litter.id}`}
                      </MenuItem>
                    ))}
                    {uploadEntityType === 'puppy' && puppies.map(puppy => (
                      <MenuItem key={puppy.id} value={puppy.id}>
                        {puppy.name || `Puppy #${puppy.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {uploadType === 'photo' ? (
                  <TextField
                    fullWidth
                    label="Caption"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    multiline
                    rows={4}
                    inputProps={{ maxLength: MAX_CAPTION_LENGTH }}
                    helperText={`${uploadCaption.length}/${MAX_CAPTION_LENGTH} characters`}
                  />
                ) : (
                  <>
                    <TextField
                      fullWidth
                      label="Title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      required
                      inputProps={{ maxLength: MAX_TITLE_LENGTH }}
                      helperText={`${uploadTitle.length}/${MAX_TITLE_LENGTH} characters`}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      multiline
                      rows={4}
                      inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                      helperText={`${uploadDescription.length}/${MAX_DESCRIPTION_LENGTH} characters`}
                    />
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleUpload}
          variant="contained" 
          color="primary"
          disabled={uploadingFile || !selectedFile}
        >
          {uploadingFile ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );

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
      
      {renderUploadDialog()}
    </Box>
  );
};

export default MediaLibrary;