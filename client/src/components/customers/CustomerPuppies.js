import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PetsIcon from '@mui/icons-material/Pets';
import { apiGet } from '../../utils/apiUtils';
import { debugError } from '../../config';

const CustomerPuppies = ({ customerId, customerName }) => {
  const navigate = useNavigate();
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadPuppies();
  }, [customerId]);
  
  const loadPuppies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch puppies associated with this customer
      const response = await apiGet(`customers/${customerId}/puppies`);
      
      if (response.success) {
        setPuppies(response.data || []);
      } else {
        throw new Error(response.error || 'Failed to load puppies');
      }
    } catch (error) {
      debugError('Error loading puppies:', error);
      setError(`Failed to load puppies: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewPuppy = (puppyId) => {
    navigate(`/puppies/${puppyId}`);
  };
  
  const handleAddPuppy = () => {
    navigate(`/puppies/new?customerId=${customerId}`);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Customer's Puppies
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PetsIcon />}
          onClick={handleAddPuppy}
        >
          Add Puppy for Customer
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : puppies.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No puppies are associated with this customer yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Litter</TableCell>
                <TableCell>Breed</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {puppies.map((puppy) => (
                <TableRow key={puppy.id}>
                  <TableCell>{puppy.name}</TableCell>
                  <TableCell>{puppy.litter_name || 'N/A'}</TableCell>
                  <TableCell>{puppy.breed_name || 'N/A'}</TableCell>
                  <TableCell>{formatDate(puppy.date_of_birth)}</TableCell>
                  <TableCell>{puppy.status || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="View Puppy Details">
                      <IconButton onClick={() => handleViewPuppy(puppy.id)} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// Add PropTypes validation
CustomerPuppies.propTypes = {
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  customerName: PropTypes.string
};

export default CustomerPuppies;
