import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  TextField, InputAdornment
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';

const ManageMedications = () => {
  const { medications, fetchMedicationRecords } = useHealth();
  const { dogs, puppies } = useDog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedications, setFilteredMedications] = useState([]);

  useEffect(() => {
    fetchMedicationRecords();
  }, [fetchMedicationRecords]);

  useEffect(() => {
    if (medications) {
      setFilteredMedications(
        medications.filter(med => {
          const animalName = getAnimalName(med);
          return med.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (med.condition && med.condition.toLowerCase().includes(searchTerm.toLowerCase()));
        })
      );
    }
  }, [medications, searchTerm]);

  const getAnimalName = (med) => {
    if (med.dog_id) {
      const dog = dogs.find(d => d.id === med.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (med.puppy_id) {
      const puppy = puppies.find(p => p.id === med.puppy_id);
      return puppy ? puppy.name : 'Unknown Puppy';
    }
    return 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (active, endDate) => {
    if (!active) return 'default';
    if (!endDate) return 'success';
    
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.floor((end - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays < 7) return 'warning';
    return 'success';
  };

  const getStatusText = (active, endDate) => {
    if (!active) return 'Inactive';
    if (!endDate) return 'Active (Ongoing)';
    
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.floor((end - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Ends Today';
    if (diffDays === 1) return 'Ends Tomorrow';
    if (diffDays < 7) return `Ends in ${diffDays} days`;
    return 'Active';
  };
  
  const getRemainingDoses = (med) => {
    if (!med.dosage_remaining) return 'Unknown';
    if (med.dosage_remaining <= 5) return <span style={{ color: 'red' }}>{med.dosage_remaining} left</span>;
    return `${med.dosage_remaining} left`;
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Medications
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/health/medications/add"
          >
            Add Medication
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search medications by name, animal, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Medication</TableCell>
                <TableCell>Animal</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Dosage</TableCell>
                <TableCell>Remaining</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedications.length > 0 ? (
                filteredMedications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell>{med.medication_name}</TableCell>
                    <TableCell>{getAnimalName(med)}</TableCell>
                    <TableCell>{med.condition || 'N/A'}</TableCell>
                    <TableCell>{med.dosage || 'N/A'}</TableCell>
                    <TableCell>{getRemainingDoses(med)}</TableCell>
                    <TableCell>{formatDate(med.start_date)}</TableCell>
                    <TableCell>{formatDate(med.end_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(med.active, med.end_date)}
                        color={getStatusColor(med.active, med.end_date)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary"
                        component={Link}
                        to={`/dashboard/health/medications/edit/${med.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {searchTerm ? 'No medications match your search' : 'No medications recorded'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default ManageMedications;
