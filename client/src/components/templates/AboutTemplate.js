import React from 'react';
import { Box } from '@mui/material';

const AboutTemplate = ({ content, page }) => {
  return (
    <Box className="page-template about-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default AboutTemplate;