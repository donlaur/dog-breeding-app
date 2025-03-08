import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, List, ListItem, ListItemText, 
  Divider, Chip, IconButton, Tooltip, Alert
} from '@mui/material';
import { 
  NotificationsActive as AlertIcon,
  Check as CheckIcon,
  WarningAmber as WarningIcon 
} from '@mui/icons-material';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';
import { format } from 'date-fns';

/**
 * HealthAlerts component to display important health notifications
 */
const HealthAlerts = () => {
  const { dashboardData, vaccinations, medicationRecords, healthConditions } = useHealth();
  const { dogs, puppies } = useDog();
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  // Process health data to generate alerts
  useEffect(() => {
    const generateAlerts = () => {
      const today = new Date();
      const newAlerts = [];
      
      // Check for soon-to-expire vaccinations (due in the next 14 days)
      if (dashboardData.upcoming_vaccinations && dashboardData.upcoming_vaccinations.items) {
        dashboardData.upcoming_vaccinations.items.forEach(vax => {
          if (!vax.next_due_date) return;
          
          const dueDate = new Date(vax.next_due_date);
          const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 14 && diffDays >= 0) {
            // Find animal name
            let animalName = 'Unknown';
            if (vax.dog_id) {
              const dog = dogs.find(d => d.id === vax.dog_id);
              animalName = dog ? dog.call_name : `Dog #${vax.dog_id}`;
            } else if (vax.puppy_id) {
              const puppy = puppies.find(p => p.id === vax.puppy_id);
              animalName = puppy ? puppy.name : `Puppy #${vax.puppy_id}`;
            }
            
            newAlerts.push({
              id: `vax-${vax.id}`,
              type: 'vaccination',
              severity: diffDays <= 7 ? 'error' : 'warning',
              title: `${vax.vaccine_name} vaccination due soon`,
              detail: `${animalName}'s vaccination due on ${format(dueDate, 'MMM d, yyyy')}`,
              date: dueDate
            });
          }
        });
      }
      
      // Check for medications that need refill (assuming medications have a quantity and dosage frequency)
      if (dashboardData.active_medications && dashboardData.active_medications.items) {
        dashboardData.active_medications.items.forEach(med => {
          if (med.quantity && med.doses_remaining && med.doses_remaining <= 5) {
            let animalName = 'Unknown';
            if (med.dog_id) {
              const dog = dogs.find(d => d.id === med.dog_id);
              animalName = dog ? dog.call_name : `Dog #${med.dog_id}`;
            } else if (med.puppy_id) {
              const puppy = puppies.find(p => p.id === med.puppy_id);
              animalName = puppy ? puppy.name : `Puppy #${med.puppy_id}`;
            }
            
            newAlerts.push({
              id: `med-${med.id}`,
              type: 'medication',
              severity: med.doses_remaining <= 2 ? 'error' : 'warning',
              title: `${med.medication_name} refill needed`,
              detail: `${animalName}'s medication has only ${med.doses_remaining} doses remaining`,
              date: today
            });
          }
        });
      }
      
      // Check for active critical health conditions
      if (dashboardData.active_conditions && dashboardData.active_conditions.items) {
        dashboardData.active_conditions.items.forEach(condition => {
          if (condition.severity === 'critical' || condition.severity === 'high') {
            let animalName = 'Unknown';
            if (condition.dog_id) {
              const dog = dogs.find(d => d.id === condition.dog_id);
              animalName = dog ? dog.call_name : `Dog #${condition.dog_id}`;
            } else if (condition.puppy_id) {
              const puppy = puppies.find(p => p.id === condition.puppy_id);
              animalName = puppy ? puppy.name : `Puppy #${condition.puppy_id}`;
            }
            
            newAlerts.push({
              id: `condition-${condition.id}`,
              type: 'condition',
              severity: condition.severity === 'critical' ? 'error' : 'warning',
              title: `Active ${condition.condition_name}`,
              detail: `${animalName} has an active ${condition.severity} severity health condition`,
              date: condition.diagnosed_date ? new Date(condition.diagnosed_date) : today
            });
          }
        });
      }
      
      // Filter out dismissed alerts and sort by severity and date
      const filteredAlerts = newAlerts
        .filter(alert => !dismissedAlerts.includes(alert.id))
        .sort((a, b) => {
          // Sort by severity first (error before warning)
          if (a.severity !== b.severity) {
            return a.severity === 'error' ? -1 : 1;
          }
          // Then sort by date (most recent first)
          return b.date - a.date;
        });
      
      setAlerts(filteredAlerts);
    };
    
    generateAlerts();
  }, [dashboardData, dogs, puppies, dismissedAlerts]);

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <AlertIcon color="warning" sx={{ mr: 1 }} />
        <Typography variant="h6">Health Alerts</Typography>
        <Chip 
          label={alerts.length} 
          color={alerts.some(a => a.severity === 'error') ? 'error' : 'warning'} 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Box>
      
      {alerts.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          No health alerts at this time. Everything looks good!
        </Alert>
      ) : (
        <List>
          {alerts.map((alert, index) => (
            <React.Fragment key={alert.id}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Tooltip title="Dismiss Alert">
                    <IconButton edge="end" aria-label="dismiss" onClick={() => handleDismissAlert(alert.id)}>
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <WarningIcon 
                  color={alert.severity} 
                  sx={{ mr: 2 }} 
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="medium">{alert.title}</Typography>
                      <Chip 
                        label={alert.type} 
                        size="small" 
                        color={alert.severity}
                        sx={{ ml: 1, textTransform: 'capitalize' }}
                      />
                    </Box>
                  }
                  secondary={alert.detail}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default HealthAlerts;
