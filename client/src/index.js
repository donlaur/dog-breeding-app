// src/index.js
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DogProvider, useDog } from './context/DogContext';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap globally
import '@fortawesome/fontawesome-free/css/all.min.css';  // Import FontAwesome
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { installApiErrorFix } from './utils/apiErrorFix';

// Install API error fix to prevent repeated calls to missing endpoints
installApiErrorFix();

// Component to initialize data
const DataInitializer = ({ children }) => {
  const { refreshDogs } = useDog();
  const initialized = useRef(false);
  
  useEffect(() => {
    // Only run once, and only if not already initialized
    if (!initialized.current) {
      console.log("DataInitializer: Loading initial data");
      initialized.current = true;
      // This will be skipped if already loading or loaded in DogProvider
      refreshDogs(true, { includeLitters: true });
    }
  }, [refreshDogs]);
  
  return children;
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <DogProvider>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <DataInitializer>
            <App />
          </DataInitializer>
        </ThemeProvider>
      </BrowserRouter>
    </DogProvider>
  </React.StrictMode>
);
