# User Account Management

## Overview

The application now includes a comprehensive user account management system that separates user accounts from breeder profile management. This system provides users with the ability to manage their account details, security settings, notifications, and system preferences.

## Features

### Account Management

1. **User Profile**
   - Update personal information (name, email)
   - View account creation date and details
   - Profile picture with auto-generated avatar

2. **Security Settings**
   - Change password functionality
   - Current password verification for security
   - Password confirmation to prevent errors
   - Logout functionality

### Notifications

1. **Notification Center**
   - List of all notifications with read/unread status
   - Categorized notifications (dogs, puppies, messages, events)
   - Actions to mark as read or delete
   - Bulk actions (mark all as read, clear all)
   - Badge indicators for unread count

2. **Notification Settings**
   - Configure notification delivery methods (email, push)
   - Toggle notifications by category
   - Notification frequency settings

### System Settings

1. **Appearance**
   - Theme selection (light, dark, system default)
   - Language preferences
   - Date format customization

2. **Data & Storage**
   - Cache management
   - Data retention settings
   - Backup frequency configuration
   - Storage usage monitoring

3. **Security & Privacy**
   - Session timeout configuration
   - Usage analytics preferences
   - Privacy controls

4. **Advanced Settings**
   - Developer mode toggle
   - Auto-save preferences
   - System diagnostic tools

## Architecture

### Backend

The account management functionality is implemented with the following components:

1. **Authentication API Endpoints**
   - `/api/auth/profile`: Get/update user profile information
   - `/api/auth/change-password`: Change user password with verification

2. **Token-based Authentication**
   - JWT tokens for secure API access
   - Token-required decorator for protected routes
   - Automatic token validation and renewal

### Frontend

1. **Account Pages**
   - `/dashboard/account`: User profile and password management
   - `/dashboard/notifications`: Notification center and settings
   - `/dashboard/settings`: System settings and preferences

2. **Integration with Header**
   - User dropdown menu with account options
   - Notification badge with unread count
   - Quick access icons for settings and notifications

3. **AuthContext Extensions**
   - Profile management functions
   - Password change functionality
   - Improved error handling and feedback

## Technical Implementation

### Authentication Flow

```javascript
// Example of profile update
const updateUserProfile = async (profileData) => {
  setLoading(true);
  try {
    const response = await apiPut('auth/profile', profileData);
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    const data = await response.json();
    setUser(prevUser => ({ ...prevUser, ...data }));
    return data;
  } catch (error) {
    setError(error.message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### Server-side Implementation

```python
@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json()
    allowed_fields = ["name", "email"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    # Update user in database
    success = db.update("users", current_user["id"], update_data)
    
    if success:
        # Return updated user data
        updated_user = db.get_by_id("users", current_user["id"])
        return jsonify({k: v for k, v in updated_user.items() if k != "password_hash"})
    else:
        return jsonify({"message": "Failed to update profile"}), 500
```

## User Experience

The new account management system provides a clean separation between:
1. **Breeder Profile**: Business information about the breeding program
2. **User Account**: Personal user information and preferences

This separation allows for future multi-user support, where different users could potentially manage the same breeding program with different access levels.

## Future Enhancements

Potential improvements to consider:
1. Multi-factor authentication
2. Social login integration
3. User role management
4. Account activity monitoring
5. Enhanced notification delivery channels