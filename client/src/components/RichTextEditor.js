import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

// Note: We're replacing ReactQuill with a simpler TextField due to compatibility issues
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, label, error }) => {
  // Simplified textarea-based rich text editor
  return (
    <Box sx={{ mb: 2 }}>
      {label && <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>}
      
      <TextField
        fullWidth
        multiline
        rows={10}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={Boolean(error)}
        helperText={error}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'inherit'
          }
        }}
      />
      
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        HTML formatting is supported. Use tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
      </Typography>
    </Box>
  );
};

export default RichTextEditor;