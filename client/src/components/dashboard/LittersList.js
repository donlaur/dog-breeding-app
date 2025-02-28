import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Avatar, 
  Divider, 
  IconButton 
} from '@mui/material';
import { 
  Visibility as LittersIcon, 
  Add as AddIcon, 
  MoreVert as MoreVertIcon 
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
  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LittersIcon color="primary" />
            <Typography variant="h6">Litters</Typography>
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
        
        {litters && litters.length > 0 ? (
          <Box>
            {litters.map((litter, index) => (
              <React.Fragment key={litter?.id || index}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    py: 1.5, 
                    alignItems: 'center',
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
                  <Avatar 
                    src={getImageUrl && getImageUrl(litter?.cover_photo)}
                    alt={litter?.name || `Litter ${index + 1}`}
                    sx={{ width: 48, height: 48 }}
                  >
                    {!litter?.cover_photo && <LittersIcon />}
                  </Avatar>
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography variant="subtitle1">
                      {litter?.name || `Litter ${index + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {litter?.dam_name && litter?.sire_name ? 
                        `${litter.dam_name} × ${litter.sire_name}` : 
                        formatDate(litter?.whelp_date) || 'New Litter'}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'medium'
                  }}>
                    {litter?.puppies_count || 0} puppies
                  </Box>
                </Box>
                {index < litters.length - 1 && <Divider />}
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
            <Typography sx={{ mb: 2 }}>No litters recorded yet</Typography>
            <Button 
              component={Link} 
              to="/dashboard/litters/add" 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Create Your First Litter
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LittersList; 