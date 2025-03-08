import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  TextField, InputAdornment, Card, CardContent, Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';

const ManageHealthRecords = () => {
  const { healthRecords, fetchHealthRecords } = useHealth();
  const { dogs, puppies } = useDog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    fetchHealthRecords();
  }, [fetchHealthRecords]);

  useEffect(() => {
    if (healthRecords) {
      setFilteredRecords(
        healthRecords.filter(record => {
          const animalName = getAnimalName(record);
          return record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 record.record_type.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
  }, [healthRecords, searchTerm]);

  const getAnimalName = (record) => {
    if (record.dog_id) {
      const dog = dogs.find(d => d.id === record.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (record.puppy_id) {
      const puppy = puppies.find(p => p.id === record.puppy_id);
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

  const getRecordTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'checkup':
        return 'success';
      case 'emergency':
        return 'error';
      case 'surgery':
        return 'warning';
      case 'dental':
        return 'info';
      case 'test':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Health Records
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/health/records/add"
          >
            Add Health Record
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search health records by title, animal, or type..."
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
                <TableCell>Title</TableCell>
                <TableCell>Animal</TableCell>
                <TableCell>Record Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Vet Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>{getAnimalName(record)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.record_type}
                        color={getRecordTypeColor(record.record_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(record.record_date)}</TableCell>
                    <TableCell>{record.vet_name || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary"
                        component={Link}
                        to={`/dashboard/health/records/${record.id}`}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        color="primary"
                        component={Link}
                        to={`/dashboard/health/records/edit/${record.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchTerm ? 'No health records match your search' : 'No health records added'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Records
                </Typography>
                <Typography variant="h5">
                  {healthRecords?.length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Records This Year
                </Typography>
                <Typography variant="h5">
                  {healthRecords?.filter(r => {
                    const recordDate = new Date(r.record_date);
                    const currentYear = new Date().getFullYear();
                    return recordDate.getFullYear() === currentYear;
                  }).length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Emergency Records
                </Typography>
                <Typography variant="h5" color="error">
                  {healthRecords?.filter(r => r.record_type.toLowerCase() === 'emergency').length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Checkups
                </Typography>
                <Typography variant="h5" color="success">
                  {healthRecords?.filter(r => r.record_type.toLowerCase() === 'checkup').length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ManageHealthRecords;
