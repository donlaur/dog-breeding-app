# Dog Breeding App Frontend Architecture

## Overview

The Dog Breeding App frontend is built with React and follows a context-based state management approach. This document outlines the structure, patterns, and key components of the frontend architecture.

## Technology Stack

- **Framework**: React
- **Routing**: React Router
- **State Management**: React Context API
- **UI Components**: Custom components with Material UI
- **API Communication**: Fetch API

## Directory Structure

```
client/
├── public/
└── src/
    ├── components/
    │   ├── common/
    │   ├── dogs/
    │   ├── health/
    │   ├── layout/
    │   └── litters/
    ├── context/
    ├── hooks/
    ├── pages/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── dogs/
    │   ├── health/
    │   ├── litters/
    │   └── user/
    ├── utils/
    ├── App.js
    └── index.js
```

## State Management

The application uses React Context for state management. Key contexts include:

- **AuthContext**: Manages user authentication state
- **DogContext**: Manages dog-related state and operations
- **LitterContext**: Manages litter and puppy-related state
- **HealthContext**: Manages health records, vaccinations, and medications
- **NotificationContext**: Manages user notifications

## API Communication Pattern

The application follows a strict pattern for API communication to ensure consistency and prevent regression bugs:

### API URL Configuration

- **API_URL** is defined in `src/config.js` as `/api`
- All API calls should import this constant: `import { API_URL, debugLog, debugError } from '../config';`
- The `apiUtils.js` file provides utility functions that automatically handle API URL formatting

### API Utility Functions

```javascript
// Import API utilities
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, sanitizeApiData } from '../utils/apiUtils';

// Example API call in a component or context
const fetchData = async () => {
  try {
    // Use the utility functions instead of direct fetch
    const response = await apiGet('endpoint');
    
    if (response.ok) {
      debugLog('Data fetched successfully:', response.data);
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch data');
    }
  } catch (error) {
    debugError('Error fetching data:', error);
    // Handle the error appropriately
    throw error;
  }
};
```

### Available API Utility Functions

- **apiGet(endpoint, options)**: For GET requests
- **apiPost(endpoint, data, options)**: For POST requests
- **apiPut(endpoint, data, options)**: For PUT requests
- **apiDelete(endpoint, options)**: For DELETE requests
- **apiUpload(endpoint, file, options)**: For file upload requests
- **sanitizeApiData(data)**: Utility to remove non-schema fields before sending to the server

### Handling Database Field Errors

The application has a recurring issue where non-existent database fields are sometimes sent to the server during API calls. This happens because:

1. The server adds additional fields to API responses (like `dam_info`, `sire_info`, `breed_info`) to provide more context
2. These fields aren't part of the database schema
3. When the client sends this data back during updates, it causes errors

To prevent this, always use the `sanitizeApiData` utility function before sending data to the server:

```javascript
const dataToSend = sanitizeApiData(formData);
const response = await apiPost('endpoint', dataToSend);
```

### IMPORTANT: Never use direct fetch calls

Always use the apiUtils functions which:
- Automatically handle authentication headers
- Format URLs correctly
- Provide consistent error handling
- Handle response parsing

❌ **Incorrect**:
```javascript
const response = await fetch(`${API_URL}/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

✅ **Correct**:
```javascript
const response = await apiPost('endpoint', data);
```

### Error Handling and Logging

All API utility functions incorporate consistent error handling and logging:

- Use `debugLog` from config.js for successful operations
- Use `debugError` from config.js for error logging
- Handle response status and errors consistently

```javascript
try {
  debugLog('Attempting to update resource:', data);
  const response = await apiPut(`resource/${id}`, data);
  
  if (response.ok) {
    debugLog('Resource updated successfully');
    // Handle success
  } else {
    throw new Error(response.error || 'Failed to update resource');
  }
} catch (error) {
  debugError('Error updating resource:', error);
  // Handle the error
}
```

## Component Structure

Components are organized by feature and follow a hierarchical structure:

1. **Pages**: Top-level components that represent entire pages/routes
2. **Layout Components**: Components that define the structure of pages
3. **Feature Components**: Components specific to a feature (dogs, litters, etc.)
4. **Common Components**: Reusable components used across features

## Notification System

The notification system uses the NotificationContext to:
- Fetch notifications from the server
- Display notification counts in the UI
- Mark notifications as read
- Create new notifications for various events

Notifications are triggered for events such as:
- Dog status changes
- Litter additions
- Health record updates
- Puppy status changes
