import React from 'react';
import { Box } from '@mui/material';

const PuppiesTemplate = ({ content, page }) => {
  return (
    <Box className="page-template puppies-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default PuppiesTemplate;