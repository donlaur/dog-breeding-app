import React from 'react';
import { Box } from '@mui/material';

const DefaultTemplate = ({ content, page }) => {
  return (
    <Box className="page-template default-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default DefaultTemplate;