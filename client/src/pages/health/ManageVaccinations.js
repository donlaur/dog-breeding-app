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

const ManageVaccinations = () => {
  const { vaccinations, fetchVaccinations } = useHealth();
  const { dogs, puppies } = useDog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVaccinations, setFilteredVaccinations] = useState([]);

  useEffect(() => {
    fetchVaccinations();
  }, [fetchVaccinations]);

  useEffect(() => {
    if (vaccinations) {
      setFilteredVaccinations(
        vaccinations.filter(vax => {
          const animalName = getAnimalName(vax);
          return vax.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 animalName.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
  }, [vaccinations, searchTerm]);

  const getAnimalName = (vax) => {
    if (vax.dog_id) {
      const dog = dogs.find(d => d.id === vax.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (vax.puppy_id) {
      const puppy = puppies.find(p => p.id === vax.puppy_id);
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

  const getStatusColor = (dueDate) => {
    if (!dueDate) return 'default';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays < 14) return 'warning';
    return 'success';
  };

  const getStatusText = (dueDate) => {
    if (!dueDate) return 'No Due Date';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays < 14) return `Due in ${diffDays} days`;
    return 'Upcoming';
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Vaccinations
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/health/vaccinations/add"
          >
            Add Vaccination
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search vaccinations by name or animal..."
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
                <TableCell>Vaccine</TableCell>
                <TableCell>Animal</TableCell>
                <TableCell>Last Given</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVaccinations.length > 0 ? (
                filteredVaccinations.map((vax) => (
                  <TableRow key={vax.id}>
                    <TableCell>{vax.vaccine_name}</TableCell>
                    <TableCell>{getAnimalName(vax)}</TableCell>
                    <TableCell>{formatDate(vax.vaccination_date)}</TableCell>
                    <TableCell>{formatDate(vax.next_due_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(vax.next_due_date)}
                        color={getStatusColor(vax.next_due_date)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary"
                        component={Link}
                        to={`/dashboard/health/vaccinations/edit/${vax.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchTerm ? 'No vaccinations match your search' : 'No vaccinations recorded'}
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

export default ManageVaccinations;
