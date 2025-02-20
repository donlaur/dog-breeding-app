// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DogProvider } from './context/DogContext';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap globally
import '@fortawesome/fontawesome-free/css/all.min.css';  // Import FontAwesome
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <DogProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DogProvider>
  </React.StrictMode>
);
