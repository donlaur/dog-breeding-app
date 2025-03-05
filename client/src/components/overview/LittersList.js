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
  Chip,
  Grid
} from '@mui/material';
import { 
  Visibility as LittersIcon, 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

/**
 * LittersList - Component for displaying litters in the dashboard
 * 
 * @param {Object} props
 * @param {Array} props.litters - Litters to display
 * @param {Function} props.getImageUrl - Function to get the image URL
 */
const LittersList = ({ 
  litters = [], 
  getImageUrl 
}) => {
  // Show all current litters instead of filtering by 'active' status
  const currentLitters = litters.filter(litter => 
    litter.status && ['born', 'active', 'expected'].includes(litter.status.toLowerCase())
  );

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LittersIcon color="primary" />
            <Typography variant="h6">Current Litters</Typography>
          </Box>
          <Box>
            <Button 
              component={Link} 
              to="/dashboard/litters/add" 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              Add Litter
            </Button>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        {currentLitters && currentLitters.length > 0 ? (
          <Box>
            {currentLitters.map((litter, index) => (
              <React.Fragment key={litter?.id || index}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    }
                  }}
                  component={Link}
                  to={`/dashboard/litters/${litter.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={getImageUrl && getImageUrl(litter?.cover_photo)}
                        alt={litter?.name || `Litter ${index + 1}`}
                        sx={{ width: 48, height: 48, mr: 2 }}
                      >
                        {!litter?.cover_photo && <LittersIcon />}
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {litter?.litter_name || `Litter #${litter.id}`}
                      </Typography>
                    </Box>
                    <Chip 
                      label={litter.status || 'Born'} 
                      color="success"
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 1, pl: 8 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FemaleIcon sx={{ mr: 1, color: 'error.light', fontSize: '1rem' }} />
                        <Typography variant="body2">
                          {litter.dam?.call_name || litter.dam?.name || (litter.dam_id ? `Dam #${litter.dam_id}` : 'Unknown Dam')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MaleIcon sx={{ mr: 1, color: 'primary.light', fontSize: '1rem' }} />
                        <Typography variant="body2">
                          {litter.sire?.call_name || litter.sire?.name || (litter.sire_id ? `Sire #${litter.sire_id}` : 'Unknown Sire')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      {litter.whelp_date ? `Born ${formatDate(litter.whelp_date)}` : 'Due date not set'}
                    </Typography>
                    {litter.num_puppies > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${litter.num_puppies} puppies`}
                          color="success"
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
                {index < currentLitters.length - 1 && <Divider />}
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
            <Typography sx={{ mb: 2 }}>No active litters</Typography>
            <Button 
              component={Link} 
              to="/dashboard/litters/add" 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Create New Litter
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LittersList; 