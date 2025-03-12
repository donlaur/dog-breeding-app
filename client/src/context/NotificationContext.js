import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Create context
export const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, userId, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    notifyOnDogStatusChange: true,
    notifyOnLitterAddition: true,
    notifyOnHealthRecordAddition: true,
    notifyOnPuppyStatusChange: true
  });

  // Fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      debugLog('Fetching notifications...');
      const result = await apiGet('notifications');
      
      // If the API returns an error (like 404), use an empty array
      if (!result.ok) {
        debugLog('Notifications API not available, using empty array');
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      // Ensure we have an array before using filter
      let fetchedNotifications = [];
      
      if (result && result.data) {
        // Handle {data: [...]} format
        fetchedNotifications = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        // Handle direct array return
        fetchedNotifications = result;
      }
      
      debugLog('Fetched notifications:', fetchedNotifications);
      setNotifications(fetchedNotifications);
      
      // Calculate unread count - now we're sure fetchedNotifications is an array
      const unreadCount = fetchedNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
      
      return fetchedNotifications;
    } catch (err) {
      debugError('Error fetching notifications:', err);
      setError('Failed to load notifications');
      // Return empty array on error
      setNotifications([]);
      setUnreadCount(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add a new notification
  const addNotification = useCallback(async (notificationData) => {
    if (!user) return null;
    
    try {
      // Transform the data to match the server's expected format
      const serverData = {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        entityId: notificationData.related_id,
        entityType: notificationData.type,
        // Other fields will be set by the server
      };
      
      // Use apiPost instead of direct fetch
      const result = await apiPost('notifications', serverData);
      const newNotification = result.data || result;
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return newNotification;
    } catch (err) {
      debugError('Error creating notification:', err);
      setError('Failed to add notification');
      return null;
    }
  }, [user]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      // Use apiPut instead of direct fetch
      const result = await apiPut(`notifications/${id}`, { read: true });
      const updatedNotification = result.data || result;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      return updatedNotification;
    } catch (error) {
      debugError('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
      return null;
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (id) => {
    try {
      // Use apiDelete instead of direct fetch
      await apiDelete(`notifications/${id}`);
      
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update unread count if the deleted notification was unread
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      debugError('Error deleting notification:', error);
      setError('Failed to delete notification');
      return false;
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Use apiPut instead of direct fetch
      await apiPut('notifications/read-all');
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      return true;
    } catch (error) {
      debugError('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
      return false;
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      // Try to clear via API
      try {
        await apiDelete('notifications');
      } catch (apiError) {
        console.error('API Error clearing notifications:', apiError);
      }
      
      // Update state regardless of API success
      setNotifications([]);
      setUnreadCount(0);
      
      // Update local storage as fallback
      localStorage.setItem('notifications', JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setError('Failed to clear notifications');
    }
  }, []);

  // Update notification settings
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // In a real app, you would also save these settings to the server
  };

  // Specific notification methods
  const notifyDogStatusUpdate = useCallback(async (dogId, dogName, newStatus) => {
    if (!settings.notifyOnDogStatusChange) return null;
    
    const title = `Dog Status Updated`;
    const message = `${dogName}'s status has been updated to ${newStatus}`;
    
    return await addNotification({
      title,
      message,
      type: 'dog',
      related_id: dogId,
      date: new Date().toISOString()
    });
  }, [addNotification, settings]);

  const notifyLitterAdded = useCallback(async (litterId, damName, sireId, sire) => {
    if (!settings.notifyOnLitterAddition) return null;
    
    const sireName = sire ? sire.call_name : 'Unknown sire';
    const title = `New Litter Added`;
    const message = `A new litter has been added for ${damName} and ${sireName}`;
    
    return await addNotification({
      title,
      message,
      type: 'litter',
      related_id: litterId,
      date: new Date().toISOString()
    });
  }, [addNotification, settings]);

  const notifyHealthRecordAdded = useCallback(async (recordId, dogId, animalName, recordType, puppyId = null) => {
    if (!settings.notifyOnHealthRecordAddition) return null;
    
    const title = `New Health Record Added`;
    const message = `A new ${recordType} record has been added for ${animalName}`;
    
    return await addNotification({
      title,
      message,
      type: 'health',
      related_id: recordId,
      dog_id: dogId,
      puppy_id: puppyId,
      date: new Date().toISOString()
    });
  }, [addNotification, settings]);

  const notifyPuppyStatusUpdate = useCallback(async (puppyId, puppyName, newStatus, litterId) => {
    if (!settings.notifyOnPuppyStatusChange) return null;
    
    const title = `Puppy Status Updated`;
    const message = `${puppyName}'s status has been updated to ${newStatus}`;
    
    return await addNotification({
      title,
      message,
      type: 'puppy',
      related_id: puppyId,
      litter_id: litterId,
      date: new Date().toISOString()
    });
  }, [addNotification, settings]);

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Set up periodic refresh of notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      settings,
      fetchNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      updateSettings,
      notifyDogStatusUpdate,
      notifyLitterAdded,
      notifyHealthRecordAdded,
      notifyPuppyStatusUpdate
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
