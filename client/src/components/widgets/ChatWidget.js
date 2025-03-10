import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Avatar,
  IconButton,
  Slide,
  Badge,
  CircularProgress,
  Divider,
  Collapse
} from '@mui/material';
import { 
  Close, 
  Send, 
  ChatBubbleOutline,
  Person,
  Pets
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ChatWidget = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  
  // User registration form
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    interestType: 'general'
  });
  
  // Current message being typed
  const [currentMessage, setCurrentMessage] = useState('');
  
  const toggleChat = () => {
    setOpen(!open);
    if (!open) {
      setUnreadCount(0);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!userInfo.name.trim() || !userInfo.email.trim()) {
        throw new Error('Name and email are required');
      }
      
      // Create a lead & initialize chat session
      const response = await fetch('/api/public/chat/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRegistered(true);
        
        // Add welcome message from system
        setMessages([
          {
            id: 'welcome',
            content: `Hi ${userInfo.name}! Thanks for reaching out. How can we help you today?`,
            sender: 'system',
            timestamp: new Date().toISOString()
          }
        ]);
        
        // Store chat session ID in local storage
        if (data.sessionId) {
          localStorage.setItem('chatSessionId', data.sessionId);
        }
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Error registering for chat:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    const newMessage = {
      id: `user-${Date.now()}`,
      content: currentMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      pending: true
    };
    
    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    
    try {
      const sessionId = localStorage.getItem('chatSessionId');
      
      const response = await fetch('/api/public/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: currentMessage
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the message to show it's been sent successfully
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, pending: false, id: data.messageId || msg.id } 
              : msg
          )
        );
        
        // If there's an auto-response, add it
        if (data.autoResponse) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `system-${Date.now()}`,
              content: data.autoResponse,
              sender: 'system',
              timestamp: new Date().toISOString()
            }]);
          }, 1000); // Slight delay to make it feel natural
        }
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Update the message to show it failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, pending: false, error: true } 
            : msg
        )
      );
    }
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Check for existing session
  useEffect(() => {
    const sessionId = localStorage.getItem('chatSessionId');
    if (sessionId) {
      // TODO: Load existing chat session
      setRegistered(true);
    }
  }, []);
  
  return (
    <>
      {/* Chat Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <IconButton
            color="primary"
            onClick={toggleChat}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              width: '60px',
              height: '60px',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}
          >
            {open ? <Close /> : <ChatBubbleOutline />}
          </IconButton>
        </Badge>
      </Box>
      
      {/* Chat Widget */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: { xs: '90%', sm: '400px' },
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            borderRadius: '10px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Pets sx={{ mr: 1 }} />
              <Typography variant="h6">
                Chat with Us
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={toggleChat}>
              <Close />
            </IconButton>
          </Box>
          
          {!registered ? (
            // Registration Form
            <Box
              component="form"
              onSubmit={handleRegister}
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                flex: 1,
                overflow: 'auto'
              }}
            >
              <Typography variant="body1" gutterBottom>
                Please provide your information to start chatting with our team
              </Typography>
              
              <TextField
                required
                fullWidth
                label="Name"
                name="name"
                value={userInfo.name}
                onChange={handleInputChange}
                variant="outlined"
                error={!!error && !userInfo.name}
              />
              
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userInfo.email}
                onChange={handleInputChange}
                variant="outlined"
                error={!!error && !userInfo.email}
                helperText={!!error && !userInfo.email ? "Email is required" : ""}
              />
              
              <TextField
                fullWidth
                label="Phone Number (optional)"
                name="phone"
                value={userInfo.phone}
                onChange={handleInputChange}
                variant="outlined"
              />
              
              <TextField
                fullWidth
                select
                label="What are you interested in?"
                name="interestType"
                value={userInfo.interestType}
                onChange={handleInputChange}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="general">General Information</option>
                <option value="puppy">Purchasing a Puppy</option>
                <option value="stud">Stud Services</option>
                <option value="other">Other</option>
              </TextField>
              
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 'auto' }}
              >
                {loading ? <CircularProgress size={24} /> : "Start Chatting"}
              </Button>
            </Box>
          ) : (
            // Chat Interface
            <>
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  backgroundColor: '#f5f5f5'
                }}
              >
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        maxWidth: '80%',
                        alignItems: 'flex-start',
                        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        sx={{
                          mr: message.sender === 'user' ? 0 : 1,
                          ml: message.sender === 'user' ? 1 : 0,
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main'
                        }}
                      >
                        {message.sender === 'user' ? <Person /> : <Pets />}
                      </Avatar>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          backgroundColor: message.sender === 'user' ? 
                            theme.palette.primary.main : 'white',
                          color: message.sender === 'user' ? 'white' : 'inherit',
                          borderRadius: message.sender === 'user' ?
                            '20px 20px 5px 20px' : '20px 20px 20px 5px',
                          position: 'relative',
                          opacity: message.pending ? 0.7 : 1
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                          mt: 0.5 
                        }}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.pending && ' • Sending...'}
                          {message.error && ' • Failed to send'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Message input */}
              <Box 
                component="form" 
                onSubmit={handleSendMessage}
                sx={{ 
                  p: 2, 
                  backgroundColor: 'background.paper',
                  borderTop: `1px solid ${theme.palette.divider}`,
                  display: 'flex'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!currentMessage.trim()}
                >
                  <Send />
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Slide>
    </>
  );
};

export default ChatWidget;
