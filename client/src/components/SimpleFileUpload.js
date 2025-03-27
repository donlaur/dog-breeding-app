import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  Paper,
  CircularProgress,
  Card,
  CardMedia,
  useMediaQuery,
  useTheme,
  IconButton,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * A simplified file upload component that just uploads a file to the server
 * without trying to associate it with any entity
 * 
 * Mobile-friendly and responsive design
 */
const SimpleFileUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Use theme and media queries for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    
    // Basic validation
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF)');
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload directly to the dogs/upload endpoint (the only one that works)
      const response = await fetch('/api/dogs/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Format the URL to point to the Flask server
      const apiBaseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
      
      // Get the file URL path from the response
      // Sometimes the server returns a full path, sometimes just the filename
      const fileUrl = data.file_url;
      
      // Create the proper URL - handling paths that may already have /uploads prefix
      let fullUrl;
      
      // Get the proper filename - sometimes it's in data.filename, sometimes in the file_url
      const filename = data.filename || 
                      (fileUrl && fileUrl.includes('/') ? fileUrl.split('/').pop() : fileUrl) || 
                      file.name;
                      
      console.log(`Got filename from response: ${filename}`);
      
      // Always construct the full URL with the Flask server address
      fullUrl = `${apiBaseUrl}/uploads/${filename}`;
      
      // Log for debugging
      console.log(`Using filename: ${filename}`);
      console.log(`Full URL constructed: ${fullUrl}`);
      
      console.log('Generated image URL:', fullUrl, 'from data:', data);
      
      // Show success message
      setSuccess(`File uploaded successfully!`);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess({
          url: fullUrl,
          file_url: fileUrl,
          original_filename: data.original_filename
        });
      }
      
      // Reset the form
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Box sx={{ width: '100%', mb: 1 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            variant="filled"
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            variant="filled"
          >
            {success}
          </Alert>
        )}
        
        {/* Mobile-friendly preview & upload buttons */}
        <Grid container spacing={2}>
          {/* Preview area - takes full width on mobile, half on desktop */}
          <Grid item xs={12} sm={preview ? 6 : 12}>
            {preview ? (
              <Card 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  position: 'relative',
                  boxShadow: 3,
                  height: { xs: 200, sm: 250, md: 300 },
                  overflow: 'hidden'
                }}
              >
                <CardMedia
                  component="img"
                  image={preview}
                  alt="Preview"
                  sx={{ 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
                <IconButton 
                  onClick={handleClearFile}
                  aria-label="remove image"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)',
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Card>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  mb: 2,
                  height: { xs: 150, sm: 200 },
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
                component="label"
                htmlFor="simple-file-upload"
              >
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="simple-file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <ImageIcon 
                  sx={{ 
                    fontSize: { xs: 40, sm: 60 }, 
                    color: 'text.secondary', 
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  align="center"
                >
                  Tap to select an image
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 1, display: { xs: 'none', sm: 'block' } }}
                >
                  JPEG, PNG or GIF • 5MB max
                </Typography>
              </Box>
            )}
            
            {/* Show file info if we have a file but mobile view */}
            {file && isMobile && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  fontSize: '0.75rem',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {file.name} ({Math.round(file.size / 1024)} KB)
              </Typography>
            )}
          </Grid>
          
          {/* Info and upload button - Only show beside preview on desktop */}
          {preview && !isMobile && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Ready to Upload
                  </Typography>
                  
                  {file && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    This image will be added to your media library and can be used across your breeding program.
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  size="large"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {uploading ? 'Uploading...' : 'Upload to Library'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
        
        {/* Mobile upload button or desktop select button (when no preview) */}
        {(isMobile || !preview) && (
          <Button
            variant="contained"
            color="primary"
            onClick={preview ? handleUpload : undefined}
            component={preview ? undefined : "label"}
            htmlFor={preview ? undefined : "simple-file-upload"}
            disabled={preview ? (!file || uploading) : false}
            startIcon={
              uploading ? <CircularProgress size={20} /> : 
              preview ? <CloudUploadIcon /> : <PhotoCameraIcon />
            }
            fullWidth
            size="large"
            sx={{ 
              mt: 1,
              height: 48,
              borderRadius: 2
            }}
          >
            {uploading ? 'Uploading...' : 
             preview ? 'Upload to Library' : 'Select an Image'}
            
            {!preview && (
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="simple-file-upload"
                type="file"
                onChange={handleFileChange}
              />
            )}
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default SimpleFileUpload;