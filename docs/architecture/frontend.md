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
    │   ├── litters/
    │   └── customers/
    ├── context/
    ├── hooks/
    ├── pages/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── dogs/
    │   ├── health/
    │   ├── litters/
    │   ├── Customers/
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
- **CustomerContext**: Manages customer-related state and operations

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
    const response = await apiGet('endpoint');
    
    if (response.success) {
      // Access data from the response object
      return response.data || [];
    } else {
      throw new Error(response.error || 'Failed to fetch data');
    }
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
- Customer lead status changes
- New contract events
- Communication follow-ups

## Customer Management System

The customer management system includes several key components:

1. **Customer Dashboard**: Main entry point for customer management
2. **Lead Management**: For tracking potential customers through the sales pipeline
   - Lead statuses: new, contacted, qualified, negotiating, sold, lost
   - Conversion of leads to customers
   
3. **Customer Communications**: For tracking all interactions with customers
   - Communication types: email, phone, message, meeting
   - Timeline view of all communications
   - Follow-up scheduling
   
4. **Contract Management**: For creating and managing customer contracts
   - Contract templates for common agreement types
   - Contract statuses: draft, sent, viewed, signed, pending, completed
   - Digital signature workflow
   
The customer management features are integrated with the sidebar navigation and use the same API utility functions as the rest of the application.

## Authentication and Authorization

The application uses AuthContext to manage user authentication state. The AuthContext is used to authenticate users and authorize access to protected routes and features.
