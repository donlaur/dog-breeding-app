import React, { useState, useEffect } from 'react';
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
  Badge,
  CircularProgress
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
import { fetchCustomers, fetchRecentLeads, fetchFollowupsDue, fetchCustomerContracts } from '../../utils/customerApiUtils';

const CustomersIndex = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for dashboard data
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeLeads: 0,
    pendingContracts: 0,
    upcomingFollowUps: 0,
    recentCommunications: 0
  });
  
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all customers
        const customersResponse = await fetchCustomers();
        const customers = customersResponse.data || [];
        
        // Fetch recent leads 
        const leadsResponse = await fetchRecentLeads(30);
        const leads = leadsResponse.data || [];
        
        // Fetch upcoming follow-ups
        const followUpsResponse = await fetchFollowupsDue(7);
        const followUps = followUpsResponse.data || [];

        // Fetch pending contracts
        const allCustomers = customers;
        let pendingContracts = 0;
        let recentCommunications = 0;
        
        // Count active leads
        const activeLeads = leads.filter(lead => 
          lead.lead_status === 'new' || 
          lead.lead_status === 'contacted' || 
          lead.lead_status === 'qualified'
        ).length;
        
        // Update stats
        setStats({
          totalCustomers: customers.length,
          activeLeads: activeLeads,
          pendingContracts: pendingContracts,
          upcomingFollowUps: followUps.length,
          recentCommunications: recentCommunications
        });
        
        // Format leads for display
        const formattedLeads = leads.map(lead => ({
          id: lead.id,
          name: lead.name,
          source: lead.lead_source || 'Unknown',
          status: lead.lead_status || 'New',
          date: new Date(lead.created_at).toISOString().split('T')[0]
        }));
        
        setRecentLeads(formattedLeads);
        
        // Format follow-ups for display
        const formattedFollowUps = followUps.map(followUp => ({
          id: followUp.id,
          customer: followUp.customer_name || 'Unknown Customer',
          type: followUp.communication_type || 'Email',
          date: new Date(followUp.follow_up_date).toISOString().split('T')[0],
          notes: followUp.notes || ''
        }));
        
        setUpcomingFollowUps(formattedFollowUps);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error loading dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, bgcolor: '#fff3f3', borderRadius: 1, mb: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
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
                {recentLeads.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No recent leads found</Typography>
                  </Box>
                ) : (
                  <List>
                    {recentLeads.map(lead => (
                      <ListItem 
                        key={lead.id}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => navigate(`/customers/${lead.id}`)}>
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
                )}
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
                {upcomingFollowUps.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">No upcoming follow-ups scheduled</Typography>
                  </Box>
                ) : (
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
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CustomersIndex;
