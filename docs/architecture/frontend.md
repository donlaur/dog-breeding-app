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

The application uses the following pattern for API communication:

### API URL Configuration

- **API_URL** is defined in `src/config.js` as `/api`
- All API calls should import this constant: `import { API_URL } from '../config';`
- The `apiUtils.js` file provides utility functions that automatically handle API URL formatting

### API Utility Functions

```javascript
// Import API utilities
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Example API call in a context
const fetchData = async () => {
  try {
    // Use the utility functions instead of direct fetch
    const result = await apiGet('endpoint');
    const data = result.data || result;
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
```

### IMPORTANT: Never use direct fetch calls

Always use the apiUtils functions which:
- Automatically handle authentication
- Format URLs correctly
- Provide consistent error handling
- Handle response parsing

❌ **Incorrect**:
```javascript
const response = await fetch(`${API_URL}/endpoint`);
```

✅ **Correct**:
```javascript
const result = await apiGet('endpoint');
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
