import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  Photo as PhotoIcon,
  Description as DocumentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { debugLog, debugError } from '../config';
import { apiGet, apiPost, apiDelete, sanitizeApiData } from '../utils/apiUtils';
import { showSuccess, showError } from '../utils/notifications';

// Constants
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
  const [photoFilter, setPhotoFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');
  
  // Entities for associating media
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [puppies, setPuppies] = useState([]);
  
  // Upload dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploadEntityType, setUploadEntityType] = useState('dog');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // File input ref
  const fileInputRef = useRef(null);
  
  // Load entities on mount
  useEffect(() => {
    fetchEntities();
  }, []);
  
  // Load media based on active tab
  useEffect(() => {
    if (activeTab === 'photos') {
      fetchPhotos(photoFilter);
    } else {
      fetchDocuments(documentFilter);
    }
  }, [activeTab, photoFilter, documentFilter]);
  
  const fetchEntities = async () => {
    try {
      const [dogsResponse, littersResponse, puppiesResponse] = await Promise.all([
        apiGet('/dogs/'),
        apiGet('/litters/'),
        apiGet('/puppies/')
      ]);
      
      setDogs(dogsResponse);
      setLitters(littersResponse);
      setPuppies(puppiesResponse);
    } catch (error) {
      debugError("Error fetching entities:", error);
      setError("Failed to load entities");
    }
  };
  
  const getEntityName = (entityType, entity) => {
    switch (entityType) {
      case 'dog':
        return entity.call_name || entity.registered_name || `Dog #${entity.id}`;
      case 'litter':
        return entity.litter_name || `Litter #${entity.id}`;
      case 'puppy':
        return entity.name || `Puppy #${entity.id}`;
      default:
        return `Entity #${entity.id}`;
    }
  };
  
  const fetchPhotos = async (filter = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      let entityType, entities;
      
      // Determine which entities to fetch photos for based on filter
      switch (filter) {
        case 'dogs':
          entityType = 'dog';
          entities = dogs;
          break;
        case 'litters':
          entityType = 'litter';
          entities = litters;
          break;
        case 'puppies':
          entityType = 'puppy';
          entities = puppies;
          break;
        case 'all':
        default:
          // Fetch all photos
          const allPhotos = [];
          
          // Dogs photos
          if (dogs.length) {
            const dogsPhotos = await fetchEntityPhotos('dog', dogs);
            allPhotos.push(...dogsPhotos);
          }
          
          // Litters photos
          if (litters.length) {
            const littersPhotos = await fetchEntityPhotos('litter', litters);
            allPhotos.push(...littersPhotos);
          }
          
          // Puppies photos
          if (puppies.length) {
            const puppiesPhotos = await fetchEntityPhotos('puppy', puppies);
            allPhotos.push(...puppiesPhotos);
          }
          
          setPhotos(allPhotos);
          setLoading(false);
          return;
      }
      
      // If not "all", fetch photos for the specific entity type
      if (entities && entities.length) {
        const entityPhotos = await fetchEntityPhotos(entityType, entities);
        setPhotos(entityPhotos);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      debugError('Error fetching photos:', error);
      setError('Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEntityPhotos = async (entityType, entities) => {
    try {
      // For each entity, fetch its photos
      const photosPromises = entities.map(entity => 
        apiGet(`/photos/${entityType}/${entity.id}`)
          .then(photos => photos.map(photo => ({
            ...photo,
            entityName: getEntityName(entityType, entity),
            entityType,
            entityId: entity.id
          })))
          .catch(err => {
            debugError(`Error fetching photos for ${entityType} #${entity.id}:`, err);
            return [];
          })
      );
      
      const photosArrays = await Promise.all(photosPromises);
      return photosArrays.flat();
    } catch (error) {
      debugError(`Error in fetchEntityPhotos for ${entityType}:`, error);
      return [];
    }
  };
  const fetchDocuments = async (filter = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      let entityType, entities;
      
      // Determine which entities to fetch documents for based on filter
      switch (filter) {
        case 'dogs':
          entityType = 'dog';
          entities = dogs;
          break;
        case 'litters':
          entityType = 'litter';
          entities = litters;
          break;
        case 'puppies':
          entityType = 'puppy';
          entities = puppies;
          break;
        case 'all':
        default:
          // Fetch all documents
          const allDocs = [];
          
          // Dogs documents
          if (dogs.length) {
            const dogsDocs = await fetchEntityDocuments('dog', dogs);
            allDocs.push(...dogsDocs);
          }
          
          // Litters documents
          if (litters.length) {
            const littersDocs = await fetchEntityDocuments('litter', litters);
            allDocs.push(...littersDocs);
          }
          
          // Puppies documents
          if (puppies.length) {
            const puppiesDocs = await fetchEntityDocuments('puppy', puppies);
            allDocs.push(...puppiesDocs);
          }
          
          setDocuments(allDocs);
          setLoading(false);
          return;
      }
      
      // If not "all", fetch documents for the specific entity type
      if (entities && entities.length) {
        const entityDocs = await fetchEntityDocuments(entityType, entities);
        setDocuments(entityDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      debugError('Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEntityDocuments = async (entityType, entities) => {
    try {
      // For each entity, fetch its documents
      const docsPromises = entities.map(entity => 
        apiGet(`/files/documents/${entityType}/${entity.id}`)
          .then(docs => docs.map(doc => ({
            ...doc,
            entityName: getEntityName(entityType, entity),
            entityType,
            entityId: entity.id
          })))
          .catch(err => {
            debugError(`Error fetching documents for ${entityType} #${entity.id}:`, err);
            return [];
          })
      );
      
      const docsArrays = await Promise.all(docsPromises);
      return docsArrays.flat();
    } catch (error) {
      debugError(`Error in fetchEntityDocuments for ${entityType}:`, error);
      return [];
    }
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const isValidType = uploadType === 'photo' 
      ? ALLOWED_IMAGE_TYPES.includes(file.type)
      : ALLOWED_DOCUMENT_TYPES.includes(file.type);
    
    if (!isValidType) {
      setUploadError(`Invalid file type. ${uploadType === 'photo' 
        ? 'Please select an image file (JPEG, PNG, GIF, WebP).'
        : 'Please select a document file (PDF, DOC, DOCX, TXT, XLS, XLSX).'}`);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds 5MB limit.`);
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
    
    // Create preview for images
    if (uploadType === 'photo' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }
  };
  
  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !uploadEntityType || !uploadEntityId) return;
    
    // Validate text inputs
    if (uploadType === 'photo') {
      if (uploadCaption && uploadCaption.length > MAX_CAPTION_LENGTH) {
        setUploadError(`Caption should be at most ${MAX_CAPTION_LENGTH} characters.`);
        return;
      }
    } else {
      if (!uploadTitle) {
        setUploadError('Title is required for documents.');
        return;
      }
      if (uploadTitle.length > MAX_TITLE_LENGTH) {
        setUploadError(`Title should be at most ${MAX_TITLE_LENGTH} characters.`);
        return;
      }
      if (uploadDescription && uploadDescription.length > MAX_DESCRIPTION_LENGTH) {
        setUploadError(`Description should be at most ${MAX_DESCRIPTION_LENGTH} characters.`);
        return;
      }
    }
    
    setUploadingFile(true);
    setUploadError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', uploadEntityType);
      formData.append('entity_id', uploadEntityId);
      
      if (uploadType === 'photo') {
        formData.append('caption', uploadCaption);
        
        // Upload photo
        const response = await apiPost('/photos/upload', formData, { isFormData: true });
        debugLog('Photo upload response:', response);
        
        showSuccess('Photo uploaded successfully!');
      } else {
        formData.append('title', uploadTitle);
        formData.append('description', uploadDescription);
        
        // Upload document
        const response = await apiPost('/files/upload', formData, { isFormData: true });
        debugLog('Document upload response:', response);
        
        showSuccess('Document uploaded successfully!');
      }
      
      // Reset form and close dialog
      handleCloseUploadDialog();
      
      // Refresh the media list
      if (uploadType === 'photo') {
        fetchPhotos(photoFilter);
      } else {
        fetchDocuments(documentFilter);
      }
    } catch (error) {
      debugError('Error uploading file:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Handle deleting media
  const handleDelete = async (id, isPhoto) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      if (isPhoto) {
        await apiDelete(`/photos/${id}`);
        setPhotos(photos.filter(photo => photo.id !== id));
        showSuccess('Photo deleted successfully!');
      } else {
        await apiDelete(`/files/${id}`);
        setDocuments(documents.filter(doc => doc.id !== id));
        showSuccess('Document deleted successfully!');
      }
    } catch (error) {
      debugError('Error deleting item:', error);
      showError(error.message || 'Failed to delete item. Please try again.');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Open upload dialog
  const handleOpenUploadDialog = (type) => {
    setUploadType(type);
    setSelectedFile(null);
    setFilePreview('');
    setUploadEntityType('dog');
    setUploadEntityId('');
    setUploadCaption('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadError(null);
    setUploadDialogOpen(true);
  };
  
  // Close upload dialog
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // Render upload dialog
  const renderUploadDialog = () => (
    <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        Upload {uploadType === 'photo' ? 'Photo' : 'Document'}
      </DialogTitle>
      <DialogContent>
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ py: 5, border: '1px dashed' }}
          >
            {uploadType === 'photo' ? 'Select Photo' : 'Select Document'}
            <input
              type="file"
              hidden
              accept={uploadType === 'photo' ? 'image/*' : '.pdf,.doc,.docx,.txt,.xls,.xlsx'}
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
          </Button>
          
          {selectedFile && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
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
                helperText={`${uploadCaption.length}/${MAX_CAPTION_LENGTH} characters max`}
                error={uploadCaption.length > MAX_CAPTION_LENGTH}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  helperText={`${uploadTitle.length}/${MAX_TITLE_LENGTH} characters max`}
                  error={uploadTitle.length > MAX_TITLE_LENGTH}
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
                  helperText={`${uploadDescription.length}/${MAX_DESCRIPTION_LENGTH} characters max`}
                  error={uploadDescription.length > MAX_DESCRIPTION_LENGTH}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseUploadDialog} disabled={uploadingFile}>
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
  );

  // Render photos grid
  const renderPhotos = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Button
            variant={photoFilter === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setPhotoFilter('all')}
            sx={{ mr: 1 }}
          >
            All
          </Button>
          <Button
            variant={photoFilter === 'dogs' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setPhotoFilter('dogs')}
            sx={{ mr: 1 }}
          >
            Dogs
          </Button>
          <Button
            variant={photoFilter === 'litters' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setPhotoFilter('litters')}
            sx={{ mr: 1 }}
          >
            Litters
          </Button>
          <Button
            variant={photoFilter === 'puppies' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setPhotoFilter('puppies')}
          >
            Puppies
          </Button>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenUploadDialog('photo')}
        >
          Add Photo
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : photos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1">No photos found.</Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenUploadDialog('photo')}
              sx={{ mt: 2 }}
            >
              Add Your First Photo
            </Button>
          </Paper>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {photos.map(photo => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={photo.url}
                  alt={photo.caption || 'Photo'}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  {photo.caption && (
                    <Typography variant="body2" gutterBottom>{photo.caption}</Typography>
                  )}
                  <Chip
                    size="small"
                    label={`${photo.entityType.charAt(0).toUpperCase() + photo.entityType.slice(1)}: ${photo.entityName}`}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    href={photo.url}
                    target="_blank"
                    startIcon={<ViewIcon />}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    href={photo.url}
                    download
                    startIcon={<DownloadIcon />}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(photo.id, true)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // Render documents grid
  const renderDocuments = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Button
            variant={documentFilter === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDocumentFilter('all')}
            sx={{ mr: 1 }}
          >
            All
          </Button>
          <Button
            variant={documentFilter === 'dogs' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDocumentFilter('dogs')}
            sx={{ mr: 1 }}
          >
            Dogs
          </Button>
          <Button
            variant={documentFilter === 'litters' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDocumentFilter('litters')}
            sx={{ mr: 1 }}
          >
            Litters
          </Button>
          <Button
            variant={documentFilter === 'puppies' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDocumentFilter('puppies')}
          >
            Puppies
          </Button>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenUploadDialog('document')}
        >
          Add Document
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1">No documents found.</Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenUploadDialog('document')}
              sx={{ mt: 2 }}
            >
              Add Your First Document
            </Button>
          </Paper>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map(doc => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover'
                  }}
                >
                  <DocumentIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>{doc.title}</Typography>
                  {doc.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {doc.description}
                    </Typography>
                  )}
                  <Chip
                    size="small"
                    label={`${doc.entityType.charAt(0).toUpperCase() + doc.entityType.slice(1)}: ${doc.entityName}`}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    href={doc.url}
                    target="_blank"
                    startIcon={<ViewIcon />}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    href={doc.url}
                    download
                    startIcon={<DownloadIcon />}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(doc.id, false)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Media Library</Typography>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
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
      
      {activeTab === 'photos' ? renderPhotos() : renderDocuments()}
      
      {renderUploadDialog()}
    </Box>
  );
};

export default MediaLibrary;
