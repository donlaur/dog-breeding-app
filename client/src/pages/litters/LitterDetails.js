// src/pages/litters/LitterDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Breadcrumbs,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const LitterDetails = () => {
  const { litterId } = useParams();
  const [litter, setLitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch litter details');
        return res.json();
      })
      .then((data) => {
        debugLog("Fetched litter details:", data);
        setLitter(Array.isArray(data) ? data[0] : data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching litter:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [litterId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!litter) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Could not find litter details.</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link 
            to="/dashboard/litters"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Litters
          </Link>
          <Typography color="text.primary">{litter.litter_name}</Typography>
        </Breadcrumbs>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2,
          mb: 4 
        }}>
          <Typography variant="h4" component="h1">
            Litter: {litter.litter_name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/dashboard/litters/edit/${litterId}`)}
          >
            Edit Litter
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Birth Date</Typography>
                  <Typography variant="body1">{litter.birth_date || "Not set"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{litter.status || "Active"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Expected Date</Typography>
                  <Typography variant="body1">{litter.expected_date || "Not set"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Planned Date</Typography>
                  <Typography variant="body1">{litter.planned_date || "Not set"}</Typography>
                </Grid>
              </Grid>

              {litter.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{litter.notes}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Parents & Breed</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Breed</Typography>
                  <Typography variant="body1">{litter.breed?.name || "Not set"}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Sire</Typography>
                  <Typography variant="body1">{litter.sire?.registered_name || "Not set"}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Dam</Typography>
                  <Typography variant="body1">{litter.dam?.registered_name || "Not set"}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Financial Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="body1">${litter.price || "0"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Deposit</Typography>
                  <Typography variant="body1">${litter.deposit || "0"}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {(litter.extras || litter.socialization) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Additional Information</Typography>
                {litter.extras && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Extras Included</Typography>
                    <Typography variant="body1">{litter.extras}</Typography>
                  </Box>
                )}
                {litter.socialization && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Socialization & Enrichment</Typography>
                    <Typography variant="body1">{litter.socialization}</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography variant="h6">Puppies in this Litter</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/dashboard/litters/${litterId}/add-puppy`)}
                >
                  Add Puppy
                </Button>
              </Box>
              
              {litter.puppies && litter.puppies.length > 0 ? (
                <List>
                  {litter.puppies.map((puppy) => (
                    <ListItem 
                      key={puppy.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'action.hover',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => navigate(`/dashboard/dogs/${puppy.id}`)}
                    >
                      <ListItemText 
                        primary={puppy.registered_name}
                        secondary={puppy.call_name}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No puppies yet.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LitterDetails;
