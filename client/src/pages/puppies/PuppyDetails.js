import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDog } from '../../context/DogContext';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Breadcrumbs,
    Alert,
    CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { apiGet, apiPut, apiDelete } from '../../utils/apiUtils';

const PuppyDetails = () => {
    const { puppyId } = useParams();
    const navigate = useNavigate();
    const { puppies, litters, refreshData } = useDog();
    const [puppy, setPuppy] = useState(null);
    const [parentLitter, setParentLitter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // First try to get puppy from context to avoid extra API calls
        if (puppies && puppies.length > 0) {
            const foundPuppy = puppies.find(p => String(p.id) === String(puppyId));
            if (foundPuppy) {
                setPuppy(foundPuppy);
                
                // If we have the puppy, try to find its litter
                if (litters && litters.length > 0 && foundPuppy.litter_id) {
                    const foundLitter = litters.find(l => 
                        String(l.id) === String(foundPuppy.litter_id)
                    );
                    if (foundLitter) {
                        setParentLitter(foundLitter);
                    }
                }
                setLoading(false);
            } else {
                // If not in context, fetch from API
                fetchPuppyDetails();
            }
        } else {
            // No puppies in context, fetch from API
            fetchPuppyDetails();
        }
    }, [puppyId, puppies, litters]);

    const fetchPuppyDetails = async () => {
        try {
            setLoading(true);
            // apiGet now returns parsed data directly
            const response = await apiGet(`puppies/${puppyId}`);
            if (response && response.ok && response.data) {
                setPuppy(response.data);
                
                // If we have a litter_id, fetch that too
                if (response.data.litter_id) {
                    const litterResponse = await apiGet(`litters/${response.data.litter_id}`);
                    if (litterResponse && litterResponse.ok && litterResponse.data) {
                        setParentLitter(litterResponse.data);
                    }
                }
            } else {
                throw new Error(response?.error || "Failed to fetch puppy data");
            }
        } catch (error) {
            console.error("Error fetching puppy details:", error);
            setError("Failed to load puppy details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setPuppy(prev => ({
            ...prev,
            [name]: name === 'is_available' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Use the apiPut utility
            await apiPut(`puppies/${puppyId}`, puppy);
            refreshData(); // Refresh context data
            setError(null);
        } catch (error) {
            console.error("Error saving puppy:", error);
            setError("Failed to save changes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this puppy?')) {
            try {
                setLoading(true);
                // Use the apiDelete utility
                await apiDelete(`puppies/${puppyId}`);
                refreshData(); // Refresh context data
                navigate('/dashboard/puppies');
            } catch (error) {
                console.error("Error deleting puppy:", error);
                setError("Failed to delete puppy. Please try again.");
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error">{error}</Alert>
                    <Button 
                        variant="outlined" 
                        onClick={() => navigate('/dashboard/puppies')}
                        sx={{ mt: 2 }}
                    >
                        Back to Puppies
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!puppy) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="warning">Puppy not found</Alert>
                    <Button 
                        variant="outlined" 
                        onClick={() => navigate('/dashboard/puppies')}
                        sx={{ mt: 2 }}
                    >
                        Back to Puppies
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
                    <Link to="/dashboard/puppies" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Puppies
                    </Link>
                    {parentLitter && (
                        <Link 
                            to={`/dashboard/litters/${parentLitter.id}/puppies`} 
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            {parentLitter.name || `Litter #${parentLitter.id}`}
                        </Link>
                    )}
                    <Typography color="text.primary">
                        {puppy.name || `Puppy #${puppy.id}`}
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Button 
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(parentLitter ? 
                            `/dashboard/litters/${parentLitter.id}/puppies` : 
                            '/dashboard/puppies')}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" component="h1">
                        {puppy.name || `Puppy #${puppy.id}`}
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Puppy Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Name"
                                        name="name"
                                        value={puppy.name || ''}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Gender</InputLabel>
                                        <Select
                                            name="gender"
                                            value={puppy.gender || ''}
                                            onChange={handleChange}
                                            label="Gender"
                                        >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Color"
                                        name="color"
                                        value={puppy.color || ''}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Markings"
                                        name="markings"
                                        value={puppy.markings || ''}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={puppy.is_available || false}
                                                onChange={handleChange}
                                                name="is_available"
                                                color="primary"
                                            />
                                        }
                                        label="Available for sale"
                                    />
                                </Grid>
                            </Grid>
                            
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Photos</Typography>
                            
                            {puppy.photo_url ? (
                                <Box sx={{ position: 'relative', mb: 2 }}>
                                    <img
                                        src={puppy.photo_url}
                                        alt={puppy.name || 'Puppy'}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                                    <Typography color="text.secondary">No photo available</Typography>
                                </Box>
                            )}
                            
                            <Button
                                variant="outlined"
                                fullWidth
                            >
                                Upload Photo
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default PuppyDetails; 