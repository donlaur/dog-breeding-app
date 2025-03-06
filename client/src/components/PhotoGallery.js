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
      
      const response = await fetch(`${API_URL}/photos/${entityType}/${entityId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching photos: ${response.status}`);
      }
      
      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err.message || 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
      formData.append('file', selectedFile);
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);
      formData.append('caption', caption);
      formData.append('is_cover', isCover);
      formData.append('order', photos.length); // Add as last photo in order
      
      const response = await fetch(`${API_URL}/photos/`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = `Upload failed (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      const newPhoto = await response.json();
      
      // Update the photos array
      if (isCover) {
        // If this is the new cover, update all other photos to not be cover
        const updatedPhotos = photos.map(photo => ({
          ...photo,
          is_cover: false
        }));
        setPhotos([...updatedPhotos, newPhoto]);
      } else {
        setPhotos([...photos, newPhoto]);
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
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete photo (${response.status})`);
      }
      
      // Remove the photo from state
      const deletedPhoto = photos.find(p => p.id === photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
      
      // Notify parent component
      onPhotoChange(null, deletedPhoto);
      
      // Show success message
      setSuccessMessage('Photo deleted successfully');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError(err.message || 'Failed to delete photo');
      setErrorSnackbarOpen(true);
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      const response = await fetch(`${API_URL}/photos/${photoId}/set-cover`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to set cover photo (${response.status})`);
      }
      
      // Update local state
      const updatedPhotos = photos.map(photo => ({
        ...photo,
        is_cover: photo.id === photoId
      }));
      
      setPhotos(updatedPhotos);
      
      // Get the new cover photo
      const coverPhoto = updatedPhotos.find(p => p.id === photoId);
      
      // Check if the image file exists by attempting to load it
      const img = new Image();
      img.onload = () => {
        console.log('Cover photo file verified as accessible');
      };
      img.onerror = () => {
        console.warn('Warning: The cover photo URL appears to be invalid or inaccessible. This may cause display issues.');
        setError('Warning: The new cover photo may not display correctly due to file access issues.');
        setErrorSnackbarOpen(true);
      };
      img.src = coverPhoto.url;
      
      // Notify parent component
      onPhotoChange(coverPhoto);
      
      // Show success message
      setSuccessMessage('Cover photo updated');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error setting cover photo:', err);
      setError(err.message || 'Failed to set cover photo');
      setErrorSnackbarOpen(true);
    }
  };

  const openZoomDialog = (photo) => {
    setCurrentZoomPhoto(photo);
    setZoomDialogOpen(true);
  };

  const handleNextPhoto = () => {
    const currentIndex = photos.findIndex(p => p.id === currentZoomPhoto.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setCurrentZoomPhoto(photos[nextIndex]);
  };

  const handlePreviousPhoto = () => {
    const currentIndex = photos.findIndex(p => p.id === currentZoomPhoto.id);
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    setCurrentZoomPhoto(photos[prevIndex]);
  };

  const handleDragEnd = async (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // Reorder the photos array
    const items = Array.from(photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update state
    setPhotos(items);

    // Save the new order to the server
    try {
      const photoIds = items.map(photo => photo.id);
      const response = await fetch(`${API_URL}/photos/${entityType}/${entityId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photo_ids: photoIds })
      });

      if (!response.ok) {
        throw new Error(`Failed to reorder photos (${response.status})`);
      }

      // Show success message
      setSuccessMessage('Photo order updated');
      setSuccessSnackbarOpen(true);
    } catch (err) {
      console.error('Error reordering photos:', err);
      setError(err.message || 'Failed to reorder photos');
      setErrorSnackbarOpen(true);
      
      // Refetch photos to reset to server state
      fetchPhotos();
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          Photos
        </Typography>
        
        {!readOnly && (
          <Button 
            variant="contained" 
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
            disabled={photos.length >= maxPhotos}
          >
            Add Photo
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : photos.length === 0 ? (
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
          <Typography color="text.secondary" mb={2}>
            No photos available
          </Typography>
          
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadDialogOpen}
            >
              Upload First Photo
            </Button>
          )}
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd} disabled={readOnly}>
          <Droppable droppableId="photo-gallery" direction="horizontal">
            {(provided) => (
              <Grid 
                container 
                spacing={2} 
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {photos.map((photo, index) => (
                  <Draggable 
                    key={photo.id.toString()} 
                    draggableId={photo.id.toString()} 
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
                        <Card>
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="200"
                              image={photo.url}
                              alt={photo.caption || `Photo ${index + 1}`}
                              sx={{ 
                                cursor: 'pointer',
                                objectFit: 'cover'
                              }}
                              onClick={() => openZoomDialog(photo)}
                            />
                            {photo.is_cover && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                Cover
                              </Box>
                            )}
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                                }
                              }}
                              onClick={() => openZoomDialog(photo)}
                            >
                              <ZoomInIcon />
                            </IconButton>
                          </Box>
                          
                          {photo.caption && (
                            <CardContent sx={{ py: 1 }}>
                              <Typography variant="body2" noWrap>
                                {photo.caption}
                              </Typography>
                            </CardContent>
                          )}
                          
                          {!readOnly && (
                            <CardActions sx={{ justifyContent: 'space-between' }}>
                              <Tooltip title={photo.is_cover ? "Current cover photo" : "Set as cover"}>
                                <IconButton 
                                  color={photo.is_cover ? "primary" : "default"}
                                  onClick={() => !photo.is_cover && handleSetCover(photo.id)}
                                  disabled={photo.is_cover}
                                >
                                  {photo.is_cover ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete photo">
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                >
                                  <DeleteIcon />
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
      <Dialog 
        open={uploadDialogOpen} 
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload-input"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="photo-upload-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select Photo
              </Button>
            </label>
            
            {filePreview && (
              <Box 
                sx={{ 
                  mt: 2, 
                  mb: 2, 
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  style={{ 
                    maxHeight: '200px', 
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }} 
                />
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              margin="normal"
            />
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Button
                color={isCover ? "primary" : "inherit"}
                variant={isCover ? "contained" : "outlined"}
                startIcon={isCover ? <StarIcon /> : <StarBorderIcon />}
                onClick={() => setIsCover(!isCover)}
                sx={{ mr: 1 }}
              >
                {isCover ? "Set as Cover Photo" : "Set as Cover Photo"}
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                {photos.length === 0 ? "First photo will automatically be set as cover photo" : ""}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose} disabled={uploadLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || uploadLoading}
            startIcon={uploadLoading ? <CircularProgress size={20} /> : null}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Zoom Dialog */}
      <Dialog
        open={zoomDialogOpen}
        onClose={() => setZoomDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {currentZoomPhoto && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {currentZoomPhoto.caption || `Photo ${photos.indexOf(currentZoomPhoto) + 1} of ${photos.length}`}
                </Typography>
                <IconButton onClick={() => setZoomDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ position: 'relative', p: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <img
                  src={currentZoomPhoto.url}
                  alt={currentZoomPhoto.caption || "Zoomed photo"}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {photos.length > 1 && (
                <>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 16,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                    }}
                    onClick={handlePreviousPhoto}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: 16,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                    }}
                    onClick={handleNextPhoto}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </>
              )}
            </DialogContent>
            {!readOnly && (
              <DialogActions>
                {!currentZoomPhoto.is_cover && (
                  <Button
                    startIcon={<StarBorderIcon />}
                    onClick={() => {
                      handleSetCover(currentZoomPhoto.id);
                      setZoomDialogOpen(false);
                    }}
                  >
                    Set as Cover
                  </Button>
                )}
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setZoomDialogOpen(false);
                    setTimeout(() => {
                      handleDeletePhoto(currentZoomPhoto.id);
                    }, 300);
                  }}
                >
                  Delete
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
      
      {/* Snackbars */}
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbarOpen(false)}
      >
        <Alert onClose={() => setErrorSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSuccessSnackbarOpen(false)}
      >
        <Alert onClose={() => setSuccessSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotoGallery;