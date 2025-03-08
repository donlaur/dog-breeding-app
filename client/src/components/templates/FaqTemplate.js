import React from 'react';
import { Box } from '@mui/material';

const FaqTemplate = ({ content, page }) => {
  return (
    <Box className="page-template faq-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default FaqTemplate;