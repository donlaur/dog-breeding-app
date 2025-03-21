import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  Paper,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { apiGet, apiDelete, apiPut } from '../utils/apiUtils';
import { API_URL } from '../config';

const PhotoGallery = ({ 
  entityType, 
  entityId, 
  onPhotoChange = () => {},
  readOnly = false,
  maxPhotos = 20,
  gridCols = { xs: 12, sm: 6, md: 4, lg: 3 }
}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [currentZoomPhoto, setCurrentZoomPhoto] = useState(null);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (entityId) {
      fetchPhotos();
    }
  }, [entityId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiGet(`photos/${entityType}/${entityId}`);
      console.log('Photo API response:', result);
      
      // Handle both direct array returns and {data: [...]} format
      const photoData = Array.isArray(result) ? result : 
                      (result && result.data && Array.isArray(result.data)) ? result.data : [];
                      
      console.log('Processed photo data:', photoData);
      setPhotos(photoData);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err.message || 'Failed to fetch photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Define allowed image types
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Please upload only JPG or PNG images.`);
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large. Maximum size is 5MB.`);
      return;
    }
    
    // Clear any previous errors
    setUploadError(null);
    setSelectedFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
    setSelectedFile(null);
    setFilePreview(null);
    setCaption('');
    setIsCover(false);
    setUploadError(null);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadError(null);
      
      const formData = new FormData();
      // Validate data once more before sending
      if (!selectedFile || !ALLOWED_FILE_TYPES.includes(selectedFile.type) || selectedFile.size > MAX_FILE_SIZE) {
        throw new Error('Invalid file - security check failed');
      }
      
      // Make sure entityId is a valid number or string
      const validEntityId = entityId ? entityId.toString() : '';
      if (!validEntityId) {
        throw new Error('Invalid entity ID');
      }
      
      // Create a secure FormData object with validated values
      formData.append('file', selectedFile);
      formData.append('entity_type', entityType);
      formData.append('entity_id', validEntityId);
      formData.append('caption', caption);  // Caption is already sanitized in the input handler
      formData.append('is_cover', isCover ? 'true' : 'false');
      
      // Ensure photos array is valid before accessing length
      const currentPhotoCount = Array.isArray(photos) ? photos.length : 0;
      formData.append('order', currentPhotoCount.toString()); // Add as last photo in order
      
      // Get token for authorization
      const token = localStorage.getItem('token');
      
      // Create custom options for FormData upload
      const uploadOptions = {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header as browser sets it with boundary
          'Authorization': token ? `Bearer ${token}` : '',
        }
      };
      
      // Use the proper API endpoint URL with trailing slash to ensure it matches the server route
      const url = `${API_URL}/photos/`;
      console.log(`Uploading photo to: ${url}`);
      
      // First try the test endpoint to verify API is working
      try {
        const testResponse = await fetch(`${API_URL}/photos/test`);
        const testResult = await testResponse.json();
        console.log('Photos API test endpoint response:', testResult);
      } catch (testError) {
        console.warn('Photos API test endpoint failed:', testError);
        // Continue anyway - don't block the actual upload
      }
      
      // Use apiRequest directly to handle FormData correctly
      console.log('Making photo upload request to:', url);
      const response = await fetch(url, uploadOptions);
      
      // Process the response
      if (!response.ok) {
        console.error(`Photo upload failed with status: ${response.status}`);
        console.error('Upload options:', {...uploadOptions, body: '[FormData]'});
        
        // Check if we can get more error details from the response
        let errorDetail = '';
        try {
          const errorResponse = await response.text();
          errorDetail = errorResponse;
          console.error('Error response:', errorResponse);
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        // Test alternate endpoint format if this failed
        if (response.status === 404) {
          console.log('Trying alternate endpoint without trailing slash...');
          try {
            const alternateUrl = `${API_URL}/photos`;
            const alternateResponse = await fetch(alternateUrl, uploadOptions);
            
            if (alternateResponse.ok) {
              console.log('Alternate endpoint succeeded!');
              const alternateData = await alternateResponse.json();
              return alternateData;
            } else {
              console.error(`Alternate endpoint also failed with status: ${alternateResponse.status}`);
            }
          } catch (altError) {
            console.error('Error with alternate endpoint:', altError);
          }
        }
        
        throw new Error(`Upload failed with status: ${response.status}${errorDetail ? ` - ${errorDetail}` : ''}`);
      }
      
      const newPhoto = await response.json();
      
      // Update the photos array
      // Ensure we're working with an array
      const currentPhotos = Array.isArray(photos) ? photos : [];
      
      if (isCover) {
        // If this is the new cover, update all other photos to not be cover
        const updatedPhotos = currentPhotos.map(photo => ({
          ...photo,
          is_cover: false
        }));
        setPhotos([...updatedPhotos, newPhoto]);
      } else {
        setPhotos([...currentPhotos, newPhoto]);
      }
      
      // Close dialog and reset
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setCaption('');
      setIsCover(false);
      
      // Notify parent component
      onPhotoChange(newPhoto);
      
      // Show success message
      setSuccessMessage('Photo uploaded successfully');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }
    
    try {
      await apiDelete(`photos/${photoId}`);
      
      // Remove the photo from state
      const deletedPhoto = photos.find(p => p.id === photoId);
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      
      // If we deleted the cover photo, set the first remaining photo as cover
      if (deletedPhoto && deletedPhoto.is_cover && updatedPhotos.length > 0) {
        const newCoverPhoto = { ...updatedPhotos[0], is_cover: true };
        
        // Update the new cover photo in the database
        await apiPut(`photos/${newCoverPhoto.id}`, {
          is_cover: true
        });
        
        // Update local state
        setPhotos(updatedPhotos.map(p => 
          p.id === newCoverPhoto.id ? newCoverPhoto : p
        ));
      } else {
        setPhotos(updatedPhotos);
      }
      
      // Notify parent component
      onPhotoChange(null);
      
      // Show success message
      setSuccessMessage('Photo deleted successfully');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo: ' + err.message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      // Update the photo in the database
      await apiPut(`photos/${photoId}`, {
        is_cover: true
      });
      
      // Update local state
      const updatedPhotos = photos.map(photo => ({
        ...photo,
        is_cover: photo.id === photoId
      }));
      
      setPhotos(updatedPhotos);
      
      // Notify parent component
      const newCoverPhoto = updatedPhotos.find(p => p.id === photoId);
      onPhotoChange(newCoverPhoto);
      
      // Show success message
      setSuccessMessage('Cover photo updated');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error setting cover photo:', err);
      setError('Failed to set cover photo: ' + err.message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleUpdateCaption = async (photoId, newCaption) => {
    try {
      // Update the photo in the database
      await apiPut(`photos/${photoId}`, {
        caption: newCaption
      });
      
      // Update local state
      const updatedPhotos = photos.map(photo => 
        photo.id === photoId ? { ...photo, caption: newCaption } : photo
      );
      
      setPhotos(updatedPhotos);
      
      // Show success message
      setSuccessMessage('Caption updated');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error updating caption:', err);
      setError('Failed to update caption: ' + err.message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleZoomPhoto = (photo) => {
    setCurrentZoomPhoto(photo);
    setZoomDialogOpen(true);
  };

  const handleZoomClose = () => {
    setZoomDialogOpen(false);
    setCurrentZoomPhoto(null);
  };

  const handleNextPhoto = () => {
    if (!currentZoomPhoto) return;
    
    const currentIndex = photos.findIndex(p => p.id === currentZoomPhoto.id);
    if (currentIndex < photos.length - 1) {
      setCurrentZoomPhoto(photos[currentIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (!currentZoomPhoto) return;
    
    const currentIndex = photos.findIndex(p => p.id === currentZoomPhoto.id);
    if (currentIndex > 0) {
      setCurrentZoomPhoto(photos[currentIndex - 1]);
    }
  };

  const onDragEnd = async (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    // If position didn't change
    if (sourceIndex === destinationIndex) {
      return;
    }
    
    // Reorder the photos array
    const reorderedPhotos = Array.from(photos);
    const [removed] = reorderedPhotos.splice(sourceIndex, 1);
    reorderedPhotos.splice(destinationIndex, 0, removed);
    
    // Update the order property for each photo
    const updatedPhotos = reorderedPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));
    
    // Update state immediately for responsive UI
    setPhotos(updatedPhotos);
    
    try {
      // Update the order in the database for the moved photo
      await apiPut(`photos/${removed.id}`, {
        order: destinationIndex
      });
      
      // Show success message
      setSuccessMessage('Photo order updated');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error updating photo order:', err);
      setError('Failed to update photo order: ' + err.message);
      setErrorSnackbarOpen(true);
      
      // Revert to original order on error
      setPhotos(photos);
    }
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbarOpen(false);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  // Render loading state
  if (loading && !photos.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error && !photos.length) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error fetching photos: {error}
      </Alert>
    );
  }

  // Make sure photos is an array and sort by order
  const photoArray = Array.isArray(photos) ? photos : [];
  const sortedPhotos = [...photoArray].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  return (
    <Box sx={{ mb: 4 }}>
      {/* Photo Gallery */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          Photos {photoArray.length > 0 && `(${photoArray.length})`}
        </Typography>
        
        {!readOnly && photoArray.length < maxPhotos && (
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
            size="small"
          >
            Add Photo
          </Button>
        )}
      </Box>
      
      {photoArray.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: 'background.default',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography color="textSecondary" gutterBottom>
            No photos available
          </Typography>
          
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadDialogOpen}
              size="small"
              sx={{ mt: 1 }}
            >
              Upload First Photo
            </Button>
          )}
        </Paper>
      ) : (
        <DragDropContext onDragEnd={onDragEnd} disabled={readOnly}>
          <Droppable droppableId="photo-gallery" direction="horizontal">
            {(provided) => (
              <Grid 
                container 
                spacing={2} 
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedPhotos.map((photo, index) => (
                  <Draggable 
                    key={(photo.id || index).toString()} 
                    draggableId={(photo.id || `temp-id-${index}`).toString()} 
                    index={index}
                    isDragDisabled={readOnly}
                  >
                    {(provided) => (
                      <Grid 
                        item 
                        {...gridCols}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            ...(photo.is_cover && {
                              border: '2px solid',
                              borderColor: 'primary.main'
                            })
                          }}
                        >
                          {photo.is_cover && (
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                left: 8, 
                                zIndex: 1,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                borderRadius: '4px',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              Cover
                            </Box>
                          )}
                          
                          <CardMedia
                            component="img"
                            image={photo.url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            sx={{ 
                              height: 200,
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleZoomPhoto(photo)}
                          />
                          
                          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {photo.caption || `Photo ${index + 1}`}
                            </Typography>
                          </CardContent>
                          
                          {!readOnly && (
                            <CardActions sx={{ pt: 0 }}>
                              {!photo.is_cover && (
                                <Tooltip title="Set as cover">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleSetCover(photo.id)}
                                    aria-label="set as cover"
                                  >
                                    <StarBorderIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Delete photo">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  aria-label="delete photo"
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="View larger">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleZoomPhoto(photo)}
                                  aria-label="view larger"
                                >
                                  <ZoomInIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </CardActions>
                          )}
                        </Card>
                      </Grid>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              Select Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Box>
          
          {filePreview && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img 
                src={filePreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  objectFit: 'contain'
                }} 
              />
            </Box>
          )}
          
          <TextField
            label="Caption (optional)"
            value={caption}
            onChange={(e) => {
              // Basic sanitization - limit length and remove potentially harmful characters
              const sanitizedValue = e.target.value
                .slice(0, 100)  // Limit to 100 characters
                .replace(/[<>{}[\]\\\/]/g, ''); // Remove potentially dangerous characters
              setCaption(sanitizedValue);
            }}
            fullWidth
            margin="normal"
            helperText="Maximum 100 characters. Special characters will be removed."
            inputProps={{ maxLength: 100 }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant={isCover ? "contained" : "outlined"}
              startIcon={isCover ? <StarIcon /> : <StarBorderIcon />}
              onClick={() => setIsCover(!isCover)}
              color={isCover ? "primary" : "inherit"}
            >
              {isCover ? "Will be set as cover" : "Set as cover photo"}
            </Button>
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || uploadLoading}
            startIcon={uploadLoading && <CircularProgress size={20} />}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Zoom Dialog */}
      <Dialog 
        open={zoomDialogOpen} 
        onClose={handleZoomClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'background.default',
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={handleZoomClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        {photos.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevPhoto}
              disabled={!currentZoomPhoto || photos.findIndex(p => p.id === currentZoomPhoto.id) === 0}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            
            <IconButton
              onClick={handleNextPhoto}
              disabled={!currentZoomPhoto || photos.findIndex(p => p.id === currentZoomPhoto.id) === photos.length - 1}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
        
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          {currentZoomPhoto && (
            <img 
              src={currentZoomPhoto.url} 
              alt={currentZoomPhoto.caption || 'Photo'} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh',
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
        
        {currentZoomPhoto && currentZoomPhoto.caption && (
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Typography variant="body1">{currentZoomPhoto.caption}</Typography>
          </DialogActions>
        )}
      </Dialog>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={errorSnackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseErrorSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Success Snackbar */}
      <Snackbar 
        open={successSnackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotoGallery;