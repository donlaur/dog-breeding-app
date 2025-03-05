import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, label, error }) => {
  // Set up Quill modules/formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ];

  // Fix for react-quill issue with SSR
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // This runs only in browser environment
      require('react-quill');
    }
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      {label && <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>}
      
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: '300px',
          marginBottom: '50px'
        }}
      />
      
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextEditor;