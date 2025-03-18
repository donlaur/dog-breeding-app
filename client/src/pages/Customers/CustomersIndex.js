import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/Notifications';

const CustomersIndex = () => {
  const navigate = useNavigate();
  
  // Sample data for demonstration
  const stats = {
    totalCustomers: 42,
    activeLeads: 15,
    pendingContracts: 7,
    upcomingFollowUps: 3,
    recentCommunications: 8
  };
  
  const recentLeads = [
    { id: 1, name: 'John Smith', source: 'Website', status: 'New', date: '2023-06-10' },
    { id: 2, name: 'Sarah Johnson', source: 'Referral', status: 'Contacted', date: '2023-06-09' },
    { id: 3, name: 'Michael Brown', source: 'Social Media', status: 'Qualified', date: '2023-06-08' }
  ];
  
  const upcomingFollowUps = [
    { id: 1, customer: 'Emily Davis', type: 'Email', date: '2023-06-12', notes: 'Send puppy photos' },
    { id: 2, customer: 'Robert Wilson', type: 'Phone', date: '2023-06-13', notes: 'Discuss contract terms' },
    { id: 3, customer: 'Jennifer Lee', type: 'Meeting', date: '2023-06-15', notes: 'Puppy selection visit' }
  ];
  
  const getStatusColor = (status) => {
    const colors = {
      'New': '#2196F3',
      'Contacted': '#FF9800',
      'Qualified': '#4CAF50',
      'Negotiating': '#9C27B0',
      'Sold': '#4CAF50',
      'Lost': '#F44336'
    };
    return colors[status] || '#9E9E9E';
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Email':
        return <EmailIcon />;
      case 'Phone':
        return <PhoneIcon />;
      case 'Meeting':
        return <EventNoteIcon />;
      default:
        return <EmailIcon />;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/customers/new')}
        >
          Add New Customer
        </Button>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers/list')} sx={{ width: '100%' }}>
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonAddIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.activeLeads}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Leads
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers/leads')} sx={{ width: '100%' }}>
                Manage Leads
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DescriptionIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.pendingContracts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Contracts
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers/contracts')} sx={{ width: '100%' }}>
                View Contracts
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={stats.upcomingFollowUps} color="error">
                <EventNoteIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h5" component="div">
                {stats.upcomingFollowUps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming Follow-ups
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers/communications')} sx={{ width: '100%' }}>
                View Calendar
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.recentCommunications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Communications
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers/communications')} sx={{ width: '100%' }}>
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Leads and Follow-ups */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Leads
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/customers/leads')}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentLeads.map(lead => (
                <ListItem 
                  key={lead.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => navigate(`/customers/leads/${lead.id}`)}>
                      <ArrowForwardIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={lead.name}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {lead.source}
                        </Typography>
                        {` — ${lead.date}`}
                      </React.Fragment>
                    }
                  />
                  <Chip 
                    label={lead.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: getStatusColor(lead.status),
                      color: 'white',
                      ml: 2
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Follow-ups
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/customers/communications')}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {upcomingFollowUps.map(followUp => (
                <ListItem 
                  key={followUp.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => navigate(`/customers/communications`)}>
                      <ArrowForwardIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {getTypeIcon(followUp.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={followUp.customer}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {followUp.date}
                        </Typography>
                        {` — ${followUp.notes}`}
                      </React.Fragment>
                    }
                  />
                  <Chip 
                    label={followUp.type} 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomersIndex;
