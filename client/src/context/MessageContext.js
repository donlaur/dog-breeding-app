import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../config';

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

  // Use API utility functions for API calls
  const messagesApi = useCallback(async (endpoint, method = 'GET', data = null) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      const fullEndpoint = `messages/${endpoint}`;
      debugLog(`Making ${method} request to ${fullEndpoint}`, data);
      
      let response;
      
      switch (method) {
        case 'GET': {
          response = await apiGet(fullEndpoint);
          break;
        }
        case 'POST': {
          response = await apiPost(fullEndpoint, data);
          break;
        }
        case 'PUT': {
          response = await apiPut(fullEndpoint, data);
          break;
        }
        case 'DELETE': {
          response = await apiDelete(fullEndpoint);
          break;
        }
        default: {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(response.error || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      debugError(`Error in messagesApi for ${endpoint}:`, error);
      throw error;
    }
  }, [isAuthenticated]);

  // Conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Fetching conversations');
      const data = await messagesApi('conversations');
      
      if (data) {
        setConversations(data);
        
        // Calculate unread count
        const unreadTotal = data.reduce((total, conv) => total + (conv.unread_count || 0), 0);
        setUnreadCount(unreadTotal);
        debugLog(`Updated conversations: ${data.length}, unread count: ${unreadTotal}`);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messagesApi]);

  const createConversation = useCallback(async (conversationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Creating new conversation:', conversationData);
      const data = await messagesApi('conversations', 'POST', conversationData);
      
      if (data) {
        // Update local state
        setConversations(prev => [data, ...prev]);
        debugLog('Conversation created successfully:', data);
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating conversation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messagesApi]);

  // Messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Fetching messages for conversation ${conversationId}`);
      const data = await messagesApi(`conversations/${conversationId}/messages`);
      
      if (data) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: data
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
        
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messagesApi, conversations]);

  const sendMessage = useCallback(async (conversationId, messageContent) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Sending message to conversation ${conversationId}:`, messageContent);
      const data = await messagesApi(`conversations/${conversationId}/messages`, 'POST', {
        content: messageContent,
        sender_id: userId
      });
      
      if (data) {
        // Update local state
        setMessages(prev => {
          const conversationMessages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: [...conversationMessages, data]
          };
        });
        debugLog('Message sent successfully:', data);
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messagesApi, userId]);

  // Mark a conversation as read
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      debugLog(`Marking conversation ${conversationId} as read`);
      const data = await messagesApi(`conversations/${conversationId}/read`, 'PUT');
      
      if (data) {
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
        debugLog(`Conversation ${conversationId} marked as read`);
      }
    } catch (error) {
      debugError(`Error marking conversation ${conversationId} as read:`, error);
    }
  }, [messagesApi, conversations]);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Poll for new messages
  useEffect(() => {
    let intervalId;
    
    if (isAuthenticated) {
      // Check for new messages every 30 seconds
      intervalId = setInterval(() => {
        fetchConversations();
        
        // Also update current conversation messages if one is selected
        if (currentConversation) {
          fetchMessages(currentConversation);
        }
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, currentConversation, fetchConversations, fetchMessages]);

  // Context value
  const contextValue = {
    conversations,
    messages,
    unreadCount,
    currentConversation,
    isLoading,
    error,
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

// Custom hook for easy context usage
export const useMessage = () => useContext(MessageContext);