import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Avatar, 
  Divider, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  Pets as PetsIcon, 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  ChevronRight as ChevronRightIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate, calculateAge } from '../../utils/dateUtils';

/**
 * PuppiesList - Component for displaying puppies in the dashboard
 * 
 * @param {Object} props
 * @param {Array} props.puppies - Puppies to display
 * @param {Function} props.navigateToDogDetails - Function to navigate to puppy details
 * @param {Function} props.getImageUrl - Function to get the image URL
 * @param {Function} props.getGenderDisplay - Function to get gender icon and color
 */
const PuppiesList = ({ 
  puppies = [], 
  navigateToDogDetails, 
  getImageUrl, 
  getGenderDisplay 
}) => {
  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetsIcon color="primary" fontSize="small" />
            <Typography variant="h6">Puppies</Typography>
          </Box>
          <Box>
            <Button 
              component={Link} 
              to="/dashboard/puppies/add" 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              Add Puppy
            </Button>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        {puppies && puppies.length > 0 ? (
          <Box>
            {puppies.map((puppy, index) => (
              <React.Fragment key={puppy?.id || index}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    py: 1.5, 
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    },
                    position: 'relative',
                    pr: 2 // Add padding for the chevron
                  }}
                  onClick={() => navigateToDogDetails && navigateToDogDetails(puppy)}
                >
                  <Avatar 
                    src={getImageUrl && getImageUrl(puppy?.profile_photo)}
                    alt={puppy?.name || 'Puppy'}
                    sx={{ width: 48, height: 48 }}
                  >
                    {!puppy?.profile_photo && <PetsIcon fontSize="small" />}
                  </Avatar>
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: '1.1rem',
                          mr: 1
                        }}
                      >
                        {puppy?.call_name || puppy?.name || 'Unnamed Puppy'}
                      </Typography>
                      {getGenderDisplay && (
                        <Typography 
                          sx={{ 
                            fontWeight: 'bold',
                            color: getGenderDisplay(puppy?.gender).color,
                            display: 'flex',
                            alignItems: 'center' 
                          }}
                        >
                          {getGenderDisplay(puppy?.gender).icon}
                        </Typography>
                      )}
                      {puppy?.birth_date && (
                        <Tooltip title={`Born: ${formatDate(puppy.birth_date)}`}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              ml: 1, 
                              color: 'text.secondary',
                              backgroundColor: 'rgba(0,0,0,0.04)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {calculateAge(puppy.birth_date)}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {puppy?.litter_name || puppy?.breed || 'Pembroke Welsh Corgi'}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: '#e3f2fd',
                    color: '#1565c0',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'medium'
                  }}>
                    Puppy
                  </Box>
                  <ChevronRightIcon 
                    fontSize="small" 
                    sx={{ 
                      color: 'text.secondary',
                      position: 'absolute',
                      right: 8
                    }} 
                  />
                </Box>
                {index < puppies.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            color: 'text.secondary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography sx={{ mb: 2 }}>No puppies in your program yet</Typography>
            <Button 
              component={Link} 
              to="/dashboard/puppies/add" 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Add Your First Puppy
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PuppiesList; 