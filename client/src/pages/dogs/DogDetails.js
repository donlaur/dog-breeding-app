import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, TableContainer, Table, TableHead, TableBody, TableRow, Paper, Chip, Button, Box, CircularProgress, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import { TableCell } from '@mui/material';
import { API_URL } from '../../config';

const DogDetails = () => {
  const theme = useTheme();
  const [dog, setDog] = useState(null);
  const [siredLitters, setSiredLitters] = useState([]);
  const [damLitters, setDamLitters] = useState([]);
  const [heatCycles, setHeatCycles] = useState([]);
  const [loadingLitters, setLoadingLitters] = useState(false);

  useEffect(() => {
    // Fetch dog details
    fetchDogDetails();
    fetchSiredLitters();
    fetchDamLitters();
    fetchHeatCycles();
  }, []);

  const fetchDogDetails = async () => {
    // Implementation of fetchDogDetails
  };

  const fetchSiredLitters = async () => {
    // Implementation of fetchSiredLitters
  };

  const fetchDamLitters = async () => {
    // Implementation of fetchDamLitters
  };

  const fetchHeatCycles = async () => {
    // Implementation of fetchHeatCycles
  };

  const fetchLitters = async (dogId, gender) => {
    if (!dogId) return;
    
    setLoadingLitters(true);
    try {
      const endpoint = gender === 'male' 
        ? `${API_URL}/litters/sire/${dogId}` 
        : `${API_URL}/litters/dam/${dogId}`;
      
      console.log(`Fetching ${gender === 'male' ? 'sired' : 'dam'} litters from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error(`Error fetching litters: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log(`Found ${data.length} ${gender === 'male' ? 'sired' : 'dam'} litters`, data);
      
      if (gender === 'male') {
        setSiredLitters(data);
      } else {
        setDamLitters(data);
      }
    } catch (error) {
      console.error(`Error fetching litters:`, error);
    } finally {
      setLoadingLitters(false);
    }
  };

  useEffect(() => {
    // ... existing code to fetch dog details ...
    
    // Add this inside the existing useEffect after you set the dog data
    if (dog && dog.id && dog.gender) {
      fetchLitters(dog.id, dog.gender);
    }
    
    // Make sure to add dog and dog.gender to the dependency array if you're adding to an existing useEffect
  }, [dog?.id, dog?.gender]);

  return (
    <div>
      {/* Breeding Information section */}
      <Box sx={{ py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Breeding Information</Typography>
        
        {dog.gender === 'female' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="subtitle1">Heat Cycles</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ ml: 'auto' }}
                component={Link}
                to={`/dashboard/heats/manage?dogId=${dog.id}`}
              >
                Manage Heats
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              No heat cycles recorded for this dog.
            </Typography>
            
            <Divider sx={{ my: 3 }} />
          </>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <PetsIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            {dog.gender === 'male' ? 'Sired Litters' : 'Dam Litters'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ ml: 'auto' }}
            component={Link}
            to="/dashboard/litters/new"
            startIcon={<AddIcon />}
          >
            New Litter
          </Button>
        </Box>
        
        {loadingLitters ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : dog.gender === 'male' && siredLitters.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Dam</TableCell>
                  <TableCell>Whelp Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Puppies</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {siredLitters.map((litter) => (
                  <TableRow key={litter.id}>
                    <TableCell>
                      {litter.dam?.call_name || `Dam #${litter.dam_id || 'Unknown'}`}
                    </TableCell>
                    <TableCell>
                      {litter.whelp_date ? new Date(litter.whelp_date).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={litter.status || 'Unknown'} 
                        color={litter.status === 'Born' ? 'success' : 'primary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{litter.num_puppies || 0}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained"
                        component={Link}
                        to={`/dashboard/litters/${litter.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : dog.gender === 'female' && damLitters.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Sire</TableCell>
                  <TableCell>Whelp Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Puppies</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {damLitters.map((litter) => (
                  <TableRow key={litter.id}>
                    <TableCell>
                      {litter.sire?.call_name || `Sire #${litter.sire_id || 'Unknown'}`}
                    </TableCell>
                    <TableCell>
                      {litter.whelp_date ? new Date(litter.whelp_date).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={litter.status || 'Unknown'} 
                        color={litter.status === 'Born' ? 'success' : 'primary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{litter.num_puppies || 0}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained"
                        component={Link}
                        to={`/dashboard/litters/${litter.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No litters {dog.gender === 'male' ? 'sired by this dog' : 'recorded for this dam'} yet.
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default DogDetails; 