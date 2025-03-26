import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  LinearProgress, 
  Typography, 
  Alert, 
  Card, 
  CardContent, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadPhoto } from '../utils/photoUtils';
import { API_URL } from '../config';

/**
 * Enhanced FileUpload component with detailed debugging and multiple upload strategies
 */
const FileUpload = ({ 
  onUploadSuccess, 
  onUploadError,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize = 5 * 1024 * 1024, // 5MB
  entityType = null,
  entityId = null
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStrategy, setUploadStrategy] = useState('cloudinary'); // Default to cloudinary
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [caption, setCaption] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setError(null);
    setSuccess(null);
    setDebugInfo(null);
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      setError(`File type not allowed. Please select: ${allowedTypes.join(', ')}`);
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validate file size
    if (maxSize && selectedFile.size > maxSize) {
      setError(`File size exceeds maximum allowed (${formatFileSize(maxSize)})`);
      setFile(null);
      setPreview(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);
    const debugData = {
      strategy: uploadStrategy,
      attempts: [],
      diagnostics: {
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        },
        entityInfo: {
          entityType,
          entityId
        },
        uploadId: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent
      }
    };
    
    // Try Cloudinary endpoint as the first strategy if specified
    if (uploadStrategy === 'cloudinary') {
      debugData.attempts.push({ method: 'cloudinary', timestamp: new Date().toISOString() });
      
      try {
        setUploadProgress(20);
        
        // Create FormData object
        const formData = new FormData();
        formData.append('file', file);
        
        // Add entity information if available
        if (entityType) formData.append('entity_type', entityType);
        if (entityId) formData.append('entity_id', entityId);
        
        // Add caption and cover info for photos
        if (file.type.startsWith('image/')) {
          formData.append('is_cover', isCover ? 'true' : 'false');
          formData.append('caption', caption);
        }
        
        setUploadProgress(30);
        
        // Upload to the cloudinary endpoint
        const token = localStorage.getItem('token');
        const response = await fetch('/api/photos/cloudinary', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: formData,
          credentials: 'include'
        });
        
        debugData.attempts[debugData.attempts.length - 1].status = response.status;
        
        if (response.ok) {
          const result = {
            success: true,
            photo: await response.json()
          };
          
          debugData.successful = 'cloudinary';
          debugData.result = result;
          
          setSuccess(`File uploaded successfully to Cloudinary: ${result.photo?.url || 'URL not available'}`);
          setError(null);
          
          // Call onUploadSuccess callback
          if (onUploadSuccess) {
            onUploadSuccess(result.photo);
          }
          
          // Clear form fields
          setFile(null);
          setPreview(null);
          setCaption('');
          setIsCover(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          setUploading(false);
          setUploadProgress(0);
          setDebugInfo(debugData);
          return; // Exit early on success
        } else {
          let errorText = await response.text();
          debugData.attempts[debugData.attempts.length - 1].error = errorText;
          
          // If strategy is specifically cloudinary, report the error
          if (uploadStrategy === 'cloudinary') {
            throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
          }
          
          // Otherwise continue with other strategies
          console.log("Cloudinary upload failed, falling back to other strategies");
        }
      } catch (e) {
        debugData.attempts[debugData.attempts.length - 1].error = e.message;
        
        // If strategy is specifically cloudinary, report the error
        if (uploadStrategy === 'cloudinary') {
          setError(`Upload failed: ${e.message}`);
          setUploading(false);
          setUploadProgress(0);
          setDebugInfo(debugData);
          
          if (onUploadError) {
            onUploadError(e);
          }
          
          return; // Exit early on specific cloudinary error
        }
      }
    }
    
    try {
      setUploadProgress(20);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Add entity information if available
      if (entityType) formData.append('entity_type', entityType);
      if (entityId) formData.append('entity_id', entityId);
      
      // Add caption and cover info for photos
      if (file.type.startsWith('image/')) {
        formData.append('is_cover', isCover ? 'true' : 'false');
        formData.append('caption', caption);
      }
      
      setUploadProgress(30);
      
      let result;
      
      if (uploadStrategy === 'auto') {
        // Strategy 0: Try Cloudinary first if in auto mode
        try {
          debugData.attempts.push({ method: 'auto-cloudinary', timestamp: new Date().toISOString() });
          
          // Upload to the cloudinary endpoint
          const token = localStorage.getItem('token');
          const response = await fetch('/api/photos/cloudinary', {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
            credentials: 'include'
          });
          
          debugData.attempts[debugData.attempts.length - 1].status = response.status;
          
          if (response.ok) {
            result = {
              success: true,
              photo: await response.json()
            };
            
            debugData.successful = 'auto-cloudinary';
            debugData.result = result;
          } else {
            debugData.attempts[debugData.attempts.length - 1].error = await response.text();
            console.log('Auto-cloudinary failed, trying other methods');
          }
        } catch (e) {
          debugData.attempts[debugData.attempts.length - 1].error = e.message;
          console.log('Auto-cloudinary error, trying other methods:', e);
        }
      }
      
      if ((uploadStrategy === 'auto' && (!result || !result.success)) || uploadStrategy === 'photoUtils') {
        // Strategy 1: Use photoUtils.uploadPhoto
        try {
          debugData.attempts.push({ method: 'photoUtils.uploadPhoto', timestamp: new Date().toISOString() });
          result = await uploadPhoto(formData);
          
          if (result.success) {
            debugData.successful = 'photoUtils.uploadPhoto';
            debugData.result = result;
          } else {
            debugData.attempts[debugData.attempts.length - 1].error = result.errors || 'Upload failed';
          }
        } catch (e) {
          debugData.attempts[debugData.attempts.length - 1].error = e.message;
          if (uploadStrategy === 'photoUtils') {
            throw e;
          }
        }
      }
      
      if ((uploadStrategy === 'auto' && (!result || !result.success)) || uploadStrategy === 'fetch-photos') {
        // Strategy 2: Direct fetch to /api/photos endpoint
        try {
          setUploadProgress(50);
          debugData.attempts.push({ method: 'fetch-photos', timestamp: new Date().toISOString() });
          
          const token = localStorage.getItem('token');
          const response = await fetch('/api/photos', {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
            credentials: 'include'
          });
          
          debugData.attempts[debugData.attempts.length - 1].status = response.status;
          
          if (response.ok) {
            result = {
              success: true,
              photo: await response.json()
            };
            debugData.successful = 'fetch-photos';
            debugData.result = result;
          } else {
            let errorText = await response.text();
            debugData.attempts[debugData.attempts.length - 1].error = errorText;
            if (uploadStrategy === 'fetch-photos') {
              throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }
          }
        } catch (e) {
          debugData.attempts[debugData.attempts.length - 1].error = e.message;
          if (uploadStrategy === 'fetch-photos') {
            throw e;
          }
        }
      }
      
      if ((uploadStrategy === 'auto' && (!result || !result.success)) || uploadStrategy === 'fetch-uploads') {
        // Strategy 3: Direct fetch to /api/uploads endpoint
        try {
          setUploadProgress(70);
          debugData.attempts.push({ method: 'fetch-uploads', timestamp: new Date().toISOString() });
          
          const token = localStorage.getItem('token');
          const response = await fetch('/api/uploads', {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
            credentials: 'include'
          });
          
          debugData.attempts[debugData.attempts.length - 1].status = response.status;
          
          if (response.ok) {
            const data = await response.json();
            result = {
              success: true,
              photo: data.data || data
            };
            debugData.successful = 'fetch-uploads';
            debugData.result = result;
          } else {
            let errorText = await response.text();
            debugData.attempts[debugData.attempts.length - 1].error = errorText;
            if (uploadStrategy === 'fetch-uploads') {
              throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }
          }
        } catch (e) {
          debugData.attempts[debugData.attempts.length - 1].error = e.message;
          if (uploadStrategy === 'fetch-uploads') {
            throw e;
          }
        }
      }
      
      if ((uploadStrategy === 'auto' && (!result || !result.success)) || uploadStrategy === 'xhr') {
        // Strategy 4: XMLHttpRequest with progress tracking
        try {
          setUploadProgress(80);
          debugData.attempts.push({ method: 'xhr', timestamp: new Date().toISOString() });
          
          result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Try uploads endpoint as fallback if we're using xhr as a last resort
            const endpoint = uploadStrategy === 'auto' ? '/api/uploads' : '/api/photos';
            console.log(`XHR using endpoint: ${endpoint}`);
            debugData.attempts[debugData.attempts.length - 1].endpoint = endpoint;
            
            xhr.open('POST', endpoint, true);
            const token = localStorage.getItem('token');
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            // Add detailed logging
            xhr.upload.onloadstart = (e) => {
              console.log('Upload started via XHR');
              debugData.attempts[debugData.attempts.length - 1].uploadStarted = new Date().toISOString();
            };
            
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                console.log(`XHR Upload progress: ${percentComplete}%`);
                debugData.attempts[debugData.attempts.length - 1].progress = percentComplete;
                setUploadProgress(80 + (percentComplete * 0.2)); // Scale to 80-100%
              }
            };
            
            xhr.upload.onloadend = (e) => {
              console.log('XHR Upload ended');
              debugData.attempts[debugData.attempts.length - 1].uploadEnded = new Date().toISOString();
            };
            
            xhr.onloadstart = () => {
              console.log('XHR response started');
            };
            
            xhr.onreadystatechange = () => {
              console.log(`XHR state: ${xhr.readyState}, status: ${xhr.status}`);
              if (xhr.readyState === 4) {
                debugData.attempts[debugData.attempts.length - 1].finalStatus = xhr.status;
                debugData.attempts[debugData.attempts.length - 1].responseHeaders = xhr.getAllResponseHeaders();
              }
            };
            
            xhr.onload = function() {
              console.log(`XHR onload complete, status: ${this.status}`);
              debugData.attempts[debugData.attempts.length - 1].responseReceived = new Date().toISOString();
              
              if (this.status >= 200 && this.status < 300) {
                try {
                  const responseText = xhr.responseText;
                  console.log(`XHR Response text: ${responseText.substring(0, 100)}...`);
                  const response = JSON.parse(responseText);
                  debugData.attempts[debugData.attempts.length - 1].parsedResponse = response;
                  
                  // Handle various response formats
                  const photoData = response.data || response;
                  
                  resolve({
                    success: true,
                    photo: photoData
                  });
                } catch (e) {
                  console.error('XHR response parse error:', e);
                  debugData.attempts[debugData.attempts.length - 1].parseError = e.message;
                  reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                }
              } else {
                console.error(`XHR error status: ${this.status}`);
                debugData.attempts[debugData.attempts.length - 1].errorStatus = this.status;
                reject(new Error(`Upload failed: ${this.status} ${xhr.responseText}`));
              }
            };
            
            xhr.onerror = function(e) {
              console.error('XHR error event:', e);
              debugData.attempts[debugData.attempts.length - 1].networkError = true;
              reject(new Error('Network error during upload'));
            };
            
            xhr.ontimeout = function() {
              console.error('XHR timeout');
              debugData.attempts[debugData.attempts.length - 1].timeout = true;
              reject(new Error('Upload timed out'));
            };
            
            // Set timeout
            xhr.timeout = 30000; // 30 seconds
            
            // Send the form data
            console.log('Sending XHR request...');
            try {
              xhr.send(formData);
            } catch (sendError) {
              console.error('Error sending XHR:', sendError);
              debugData.attempts[debugData.attempts.length - 1].sendError = sendError.message;
              reject(sendError);
            }
          });
          
          if (result.success) {
            debugData.successful = 'xhr';
            debugData.result = result;
          }
        } catch (e) {
          debugData.attempts[debugData.attempts.length - 1].error = e.message;
          if (uploadStrategy === 'xhr') {
            throw e;
          }
        }
      }
      
      // Check if any strategy was successful
      if (result && result.success) {
        setSuccess(`File uploaded successfully: ${result.photo?.url || 'URL not available'}`);
        setError(null);
        
        // Call onUploadSuccess callback
        if (onUploadSuccess) {
          onUploadSuccess(result.photo);
        }
        
        // Clear form fields
        setFile(null);
        setPreview(null);
        setCaption('');
        setIsCover(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('All upload strategies failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      
      // Call onUploadError callback
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setDebugInfo(debugData);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            File Upload
          </Typography>
          
          <form onSubmit={handleUpload}>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={uploading}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept={allowedTypes.join(',')}
                  ref={fileInputRef}
                />
              </Button>
            </Box>
            
            {file && (
              <Box sx={{ mb: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    File Selected:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {file.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {file.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Size:</strong> {formatFileSize(file.size)}
                  </Typography>
                </Paper>
                
                {preview && (
                  <Box 
                    sx={{ 
                      mt: 2, 
                      textAlign: 'center', 
                      border: '1px solid #eee', 
                      p: 1, 
                      borderRadius: 1 
                    }}
                  >
                    <img 
                      src={preview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </Box>
                )}
              </Box>
            )}
            
            {file && file.type.startsWith('image/') && (
              <Box sx={{ mb: 3 }}>
                <TextField 
                  label="Caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="small"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={isCover ? "contained" : "outlined"}
                    color={isCover ? "primary" : "inherit"}
                    onClick={() => setIsCover(!isCover)}
                    size="small"
                  >
                    {isCover ? "✓ Set as cover photo" : "Set as cover photo"}
                  </Button>
                </Box>
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="upload-strategy-label">Upload Strategy</InputLabel>
                <Select
                  labelId="upload-strategy-label"
                  value={uploadStrategy}
                  onChange={(e) => setUploadStrategy(e.target.value)}
                  label="Upload Strategy"
                  disabled={uploading}
                >
                  <MenuItem value="auto">Auto (Try all methods)</MenuItem>
                  <MenuItem value="cloudinary">Cloudinary (Recommended)</MenuItem>
                  <MenuItem value="photoUtils">photoUtils.uploadPhoto</MenuItem>
                  <MenuItem value="fetch-photos">fetch to /api/photos</MenuItem>
                  <MenuItem value="fetch-uploads">fetch to /api/uploads</MenuItem>
                  <MenuItem value="xhr">XMLHttpRequest</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                icon={<CheckCircleIcon fontSize="inherit" />}
              >
                {success}
              </Alert>
            )}
            
            {uploading && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                />
                <Typography 
                  variant="caption" 
                  align="center" 
                  display="block" 
                  sx={{ mt: 1 }}
                >
                  Uploading... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={uploading || (!file && !error && !success)}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!file || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </Box>
          </form>
          
          {debugInfo && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Debug Information:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#f5f5f5', 
                  maxHeight: 200, 
                  overflow: 'auto' 
                }}
              >
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FileUpload;