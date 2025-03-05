import React from 'react';
import { Box } from '@mui/material';

const ContactTemplate = ({ content, page }) => {
  return (
    <Box className="page-template contact-template">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default ContactTemplate;