import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip,
  Grid,
  Divider
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const HeatList = ({ heats, setHeats }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isActive = (heat) => {
    const endDate = new Date(heat.end_date);
    return endDate >= new Date();
  };

  return (
    <Box sx={{ mt: 3 }}>
      {heats.map((heat) => (
        <Paper key={heat.id} sx={{ p: 3, mb: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {heat.dog_name}
              {heat.mating_date && heat.sire_name && (
                <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                  & {heat.sire_name}
                </Typography>
              )}
            </Typography>
            <Chip 
              label={isActive(heat) ? "active" : "completed"} 
              color={isActive(heat) ? "primary" : "default"}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Start:
              </Typography>
              <Typography variant="body1">
                {formatDate(heat.start_date)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                End:
              </Typography>
              <Typography variant="body1">
                {formatDate(heat.end_date)}
              </Typography>
            </Grid>
            {heat.mating_date && (
              <>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mating:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(heat.mating_date)}
                  </Typography>
                </Grid>
                {heat.expected_whelp_date && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Expected Whelp:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(heat.expected_whelp_date)}
                    </Typography>
                  </Grid>
                )}
              </>
            )}
          </Grid>

          {heat.notes && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              {heat.notes}
            </Typography>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to={`/dashboard/heats/${heat.id}/edit`}
              variant="contained"
              startIcon={<EditIcon />}
            >
              EDIT
            </Button>
            <Button
              onClick={() => setHeats(heats.filter((h) => h.id !== heat.id))}
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              DELETE
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default HeatList; 