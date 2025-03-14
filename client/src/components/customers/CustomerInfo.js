import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import DateRangeIcon from '@mui/icons-material/DateRange';
import InfoIcon from '@mui/icons-material/Info';
import FlagIcon from '@mui/icons-material/Flag';
import EventIcon from '@mui/icons-material/Event';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import InterestsIcon from '@mui/icons-material/Interests';
import NotesIcon from '@mui/icons-material/Notes';

const CustomerInfo = ({ customer }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format address
  const formatAddress = () => {
    const addressParts = [
      customer.address,
      customer.city,
      customer.state,
      customer.zip_code,
      customer.country
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Contact Information
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Name" secondary={customer.name} />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Email" 
                secondary={customer.email || 'No email provided'} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PhoneIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Phone" 
                secondary={customer.phone || 'No phone provided'} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Address" 
                secondary={formatAddress()} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ContactMailIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Preferred Contact Method" 
                secondary={customer.preferred_contact_method || 'Not specified'} 
              />
            </ListItem>
          </List>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Lead Information
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <FlagIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Lead Status" 
                secondary={customer.lead_status || 'Not specified'} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Lead Source" 
                secondary={customer.lead_source || 'Unknown'} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Lead Date" 
                secondary={formatDate(customer.lead_date)} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DateRangeIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Last Contact Date" 
                secondary={formatDate(customer.last_contact_date) || 'Never contacted'} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <InterestsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Interests" 
                secondary={customer.interests || 'None specified'} 
                secondaryTypographyProps={{ 
                  style: { 
                    whiteSpace: 'pre-wrap',
                    maxHeight: '120px',
                    overflow: 'auto'
                  } 
                }}
              />
            </ListItem>
          </List>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {customer.notes || 'No notes provided for this customer.'}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(customer.created_at)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last Updated: {formatDate(customer.updated_at)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Add PropTypes validation
CustomerInfo.propTypes = {
  customer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    name: PropTypes.string, // Combined name field
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    zip_code: PropTypes.string,
    country: PropTypes.string,
    lead_status: PropTypes.string,
    lead_source: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    preferred_contact_method: PropTypes.string,
    notes: PropTypes.string,
    interests: PropTypes.string
  }).isRequired
};

export default CustomerInfo;
