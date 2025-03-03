import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, TableContainer, Table, TableHead, TableBody, TableRow, Paper, Chip, Button, Box } from '@mui/material';
import { FavoriteIcon, PetsIcon, AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { 
  TableCell,
  Link as RouterLink
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';

const DogDetails = () => {
  const theme = useTheme();
  const [dog, setDog] = useState(null);
  const [siredLitters, setSiredLitters] = useState([]);
  const [damLitters, setDamLitters] = useState([]);
  const [heatCycles, setHeatCycles] = useState([]);

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

  const fetchDogLitters = async (dogId, gender) => {
    if (!dogId) return;
    
    try {
      const endpoint = gender === 'male' 
        ? `${API_URL}/litters/sire/${dogId}` 
        : `${API_URL}/litters/dam/${dogId}`;
      
      console.log(`Fetching ${gender === 'male' ? 'sired' : 'dam'} litters from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Error fetching litters: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.length} ${gender === 'male' ? 'sired' : 'dam'} litters`, data);
      
      if (gender === 'male') {
        setSiredLitters(data);
      } else {
        setDamLitters(data);
      }
    } catch (error) {
      console.error(`Error fetching ${gender === 'male' ? 'sired' : 'dam'} litters:`, error);
    }
  };

  useEffect(() => {
    // ... existing code to fetch dog details ...
    
    // Add this inside the existing useEffect after you set the dog data
    if (dog && dog.gender) {
      fetchDogLitters(dog.id, dog.gender);
    }
    
    // Make sure to add dog and dog.gender to the dependency array if you're adding to an existing useEffect
  }, [dog, dog?.gender]);

  return (
    <div>
      {/* Breeding Information section */}
      <Typography variant="h6" gutterBottom>
        Breeding Information
      </Typography>

      {/* Show different breeding information based on gender */}
      {dog.gender === 'male' ? (
        <>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mt: 3, mb: 2 }}>
            <PetsIcon sx={{ mr: 1 }} /> Sired Litters
          </Typography>
          
          {/* Table for sired litters */}
          {siredLitters && siredLitters.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                    <TableCell>Dam</TableCell>
                    <TableCell>Whelp Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Puppies</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {siredLitters.map((litter) => (
                    <TableRow key={litter.id}>
                      <TableCell>
                        {litter.dam ? (
                          <Link to={`/dashboard/dogs/${litter.dam_id}`}>
                            {litter.dam.call_name || 'Unnamed'}
                          </Link>
                        ) : (
                          `ID: ${litter.dam_id || 'Unknown'}`
                        )}
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
                      <TableCell>
                        <Button 
                          size="small" 
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
            <Typography variant="body2" color="text.secondary">
              No litters sired by this dog.
            </Typography>
          )}
        </>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mt: 3, mb: 2 }}>
            <PetsIcon sx={{ mr: 1 }} /> Dam Litters
          </Typography>
          
          {/* Table for dam litters */}
          {damLitters && damLitters.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                    <TableCell>Sire</TableCell>
                    <TableCell>Whelp Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Puppies</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {damLitters.map((litter) => (
                    <TableRow key={litter.id}>
                      <TableCell>
                        {litter.sire ? (
                          <Link to={`/dashboard/dogs/${litter.sire_id}`}>
                            {litter.sire.call_name || 'Unnamed'}
                          </Link>
                        ) : (
                          `ID: ${litter.sire_id || 'Unknown'}`
                        )}
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
                      <TableCell>
                        <Button 
                          size="small" 
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
            <Typography variant="body2" color="text.secondary">
              No litters from this dog.
            </Typography>
          )}
        </>
      )}

      {/* Heat cycles section - only for female dogs */}
      {dog.gender === 'female' && (
        <>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 2 }}>
            <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} /> Heat Cycles
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {heatCycles && heatCycles.length > 0 
                ? `${heatCycles.length} heat cycles recorded.` 
                : 'No heat cycles recorded for this dog.'}
            </Typography>
            
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              component={Link}
              to={`/dashboard/heats/new?dog=${dog.id}`}
            >
              Add Heat Cycle
            </Button>
          </Box>
        </>
      )}
    </div>
  );
};

export default DogDetails; 