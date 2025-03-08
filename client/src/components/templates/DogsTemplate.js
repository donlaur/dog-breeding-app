import React from 'react';
import { Box } from '@mui/material';

const DogsTemplate = ({ content, page }) => {
  return (
    <Box className="page-template dogs-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default DogsTemplate;