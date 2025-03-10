import React from 'react';
import ChatWidget from '../widgets/ChatWidget';

// A simple wrapper component that adds the ChatWidget to any public page
const PublicLayout = ({ children }) => {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
};

export default PublicLayout;
