import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { isAuthenticated, getToken, userId } = useAuth();
  
  // State for messaging
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentConversation, setCurrentConversation] = useState(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function for authenticated API calls
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      };
      
      const response = await fetch(`/api/messages/${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching from /api/messages/${endpoint}:`, error);
      throw error;
    }
  }, [isAuthenticated, getToken]);

  // Conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('conversations');
      if (response.success) {
        setConversations(response.data);
        
        // Calculate unread count
        const unreadTotal = response.data.reduce((total, conv) => total + (conv.unread_count || 0), 0);
        setUnreadCount(unreadTotal);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createConversation = useCallback(async (conversationData) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('conversations', {
        method: 'POST',
        body: JSON.stringify(conversationData)
      });
      
      if (response.success) {
        // Update local state
        setConversations(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating conversation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`conversations/${conversationId}/messages`);
      if (response.success) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: response.data
        }));
        
        // Set as current conversation
        setCurrentConversation(conversationId);
        
        // Update unread status in conversations
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unread_count: 0 };
            }
            return conv;
          })
        );
        
        // Recalculate unread count
        const unreadTotal = conversations.reduce((total, conv) => 
          conv.id === conversationId ? total : total + (conv.unread_count || 0), 0);
        setUnreadCount(unreadTotal);
        
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, conversations]);

  const sendMessage = useCallback(async (conversationId, messageContent) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: messageContent,
          sender_id: userId
        })
      });
      
      if (response.success) {
        // Update local state
        setMessages(prev => {
          const conversationMessages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: [...conversationMessages, response.data]
          };
        });
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, userId]);

  // Mark a conversation as read
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      const response = await fetchWithAuth(`conversations/${conversationId}/read`, {
        method: 'PUT'
      });
      
      if (response.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unread_count: 0 };
            }
            return conv;
          })
        );
        
        // Recalculate unread count
        const unreadTotal = conversations.reduce((total, conv) => 
          conv.id === conversationId ? total : total + (conv.unread_count || 0), 0);
        setUnreadCount(unreadTotal);
      }
    } catch (error) {
      console.error(`Error marking conversation ${conversationId} as read:`, error);
    }
  }, [fetchWithAuth, conversations]);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Context value
  const contextValue = {
    // Data states
    conversations,
    messages,
    unreadCount,
    currentConversation,
    
    // Status
    isLoading,
    error,
    
    // Functions
    fetchConversations,
    createConversation,
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    setCurrentConversation
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => useContext(MessageContext);