import React, { useEffect } from 'react';
import { 
  Container, Grid, Typography, Paper, Box, Button, CircularProgress, 
  Divider, List, ListItem, ListItemText, ListItemSecondary, Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';
import VaccineIcon from '@mui/icons-material/Vaccines';
import MedicationIcon from '@mui/icons-material/Medication';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Dashboard tile component for consistent styling
const DashboardTile = ({ title, icon, count, children, color = 'primary', linkTo }) => {
  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center">
          {icon}
          <Typography variant="h6" component="h2" ml={1}>
            {title}
          </Typography>
        </Box>
        <Chip label={count} color={color} size="small" />
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 300 }}>
        {children}
      </Box>
      {linkTo && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button 
            component={Link} 
            to={linkTo} 
            size="small" 
            endIcon={<AddIcon />}
          >
            View All
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// Map record type to appropriate color
const getRecordTypeColor = (type) => {
  const typeColors = {
    'examination': 'info',
    'surgery': 'error',
    'treatment': 'warning',
    'test': 'secondary',
    'vaccination': 'success'
  };
  return typeColors[type] || 'default';
};

// Health dashboard main component
const HealthDashboard = () => {
  const { dogs, puppies } = useDog();
  const { 
    dashboardData, isLoading, error, fetchDashboardData,
    fetchHealthRecords, fetchVaccinations, fetchMedicationRecords, fetchHealthConditions
  } = useHealth();

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get animal name from id
  const getAnimalName = (item) => {
    if (item.dog_id) {
      const dog = dogs.find(d => d.id === item.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (item.puppy_id) {
      const puppy = puppies.find(p => p.id === item.puppy_id);
      return puppy ? puppy.name : 'Unknown Puppy';
    }
    return 'Unknown';
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
          <ErrorOutlineIcon color="error" style={{ fontSize: 60 }} />
          <Typography variant="h5" color="error" mt={2}>Error Loading Health Data</Typography>
          <Typography color="textSecondary" mt={1}>{error}</Typography>
          <Button variant="contained" onClick={fetchDashboardData} sx={{ mt: 3 }}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box my={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Health Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Monitor the health status of your dogs and puppies
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upcoming Vaccinations */}
        <Grid item xs={12} md={6}>
          <DashboardTile 
            title="Upcoming Vaccinations" 
            icon={<VaccineIcon color="success" />} 
            count={dashboardData.upcoming_vaccinations.count}
            color="success"
            linkTo="/health/vaccinations"
          >
            {dashboardData.upcoming_vaccinations.items.length > 0 ? (
              <List disablePadding>
                {dashboardData.upcoming_vaccinations.items.map((vax) => (
                  <ListItem key={vax.id} divider>
                    <ListItemText
                      primary={vax.vaccine_name}
                      secondary={`${getAnimalName(vax)} - Due: ${formatDate(vax.next_due_date)}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} textAlign="center">
                <Typography color="textSecondary">No upcoming vaccinations</Typography>
              </Box>
            )}
          </DashboardTile>
        </Grid>

        {/* Active Medications */}
        <Grid item xs={12} md={6}>
          <DashboardTile 
            title="Active Medications" 
            icon={<MedicationIcon color="warning" />} 
            count={dashboardData.active_medications.count}
            color="warning"
            linkTo="/health/medications"
          >
            {dashboardData.active_medications.items.length > 0 ? (
              <List disablePadding>
                {dashboardData.active_medications.items.map((med) => (
                  <ListItem key={med.id} divider>
                    <ListItemText
                      primary={med.medication_name}
                      secondary={`${getAnimalName(med)} - ${med.dosage || 'No dosage specified'}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} textAlign="center">
                <Typography color="textSecondary">No active medications</Typography>
              </Box>
            )}
          </DashboardTile>
        </Grid>

        {/* Active Health Conditions */}
        <Grid item xs={12} md={6}>
          <DashboardTile 
            title="Health Conditions" 
            icon={<MonitorHeartIcon color="error" />} 
            count={dashboardData.active_conditions.count}
            color="error"
            linkTo="/health/conditions"
          >
            {dashboardData.active_conditions.items.length > 0 ? (
              <List disablePadding>
                {dashboardData.active_conditions.items.map((condition) => (
                  <ListItem key={condition.id} divider>
                    <ListItemText
                      primary={condition.condition_name}
                      secondary={`${getAnimalName(condition)} - Status: ${condition.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} textAlign="center">
                <Typography color="textSecondary">No active health conditions</Typography>
              </Box>
            )}
          </DashboardTile>
        </Grid>

        {/* Recent Health Records */}
        <Grid item xs={12} md={6}>
          <DashboardTile 
            title="Recent Health Records" 
            icon={<EventNoteIcon color="info" />} 
            count={dashboardData.recent_records.count}
            color="info"
            linkTo="/health/records"
          >
            {dashboardData.recent_records.items.length > 0 ? (
              <List disablePadding>
                {dashboardData.recent_records.items.map((record) => (
                  <ListItem key={record.id} divider>
                    <ListItemText
                      primary={record.title}
                      secondary={`${getAnimalName(record)} - ${formatDate(record.record_date)}`}
                    />
                    <Chip 
                      size="small" 
                      label={record.record_type} 
                      color={getRecordTypeColor(record.record_type)}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} textAlign="center">
                <Typography color="textSecondary">No recent health records</Typography>
              </Box>
            )}
          </DashboardTile>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              component={Link}
              to="/health/records/add"
            >
              Add Health Record
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<VaccineIcon />}
              component={Link}
              to="/health/vaccinations/add"
            >
              Add Vaccination
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<AddIcon />}
              component={Link}
              to="/health/weights/add"
            >
              Add Weight
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="warning" 
              startIcon={<MedicationIcon />}
              component={Link}
              to="/health/medications/add"
            >
              Add Medication
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HealthDashboard;