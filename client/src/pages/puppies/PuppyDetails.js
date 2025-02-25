import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    Divider
} from '@mui/material';
import { API_URL } from '../../config';

const PuppyDetails = () => {
    const { puppyId } = useParams();
    const [puppy, setPuppy] = useState({
        name: '',
        description: '',
        gender: '',
        color: '',
        collar_color: '',
        is_available: true,
        microchip: '',
        price: '',
        min_weight: '',
        max_weight: '',
        notes: '',
        photo_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPuppyDetails();
    }, [puppyId]);

    const fetchPuppyDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/litters/puppies/${puppyId}`);
            if (!response.ok) throw new Error('Failed to fetch puppy details');
            const data = await response.json();
            setPuppy(data);
        } catch (error) {
            setError(error.message);
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
            const response = await fetch(`${API_URL}/litters/puppies/${puppyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(puppy)
            });
            if (!response.ok) throw new Error('Failed to update puppy');
            // Show success message or redirect
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this puppy?')) return;
        
        try {
            const response = await fetch(`${API_URL}/litters/puppies/${puppyId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete puppy');
            // Redirect to litter page
        } catch (error) {
            setError(error.message);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={4}>
                {/* Info Section */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h4" gutterBottom>
                        {puppy.name || 'New Puppy'}
                    </Typography>
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={puppy.is_available}
                                onChange={handleChange}
                                name="is_available"
                            />
                        }
                        label="Available"
                    />

                    <Box component={Paper} sx={{ p: 3, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Info</Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={puppy.name}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Description"
                                    name="description"
                                    value={puppy.description}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        name="gender"
                                        value={puppy.gender}
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
                                    value={puppy.color}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Color Description"
                                    name="color_description"
                                    value={puppy.color_description || ''}
                                    onChange={handleChange}
                                    helperText="E.g., Will be a true red, see dad's profile for color reference"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Minimum Weight"
                                    name="min_weight"
                                    type="number"
                                    value={puppy.min_weight}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Maximum Weight"
                                    name="max_weight"
                                    type="number"
                                    value={puppy.max_weight}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Price"
                                    name="price"
                                    type="number"
                                    value={puppy.price}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Microchip #"
                                    name="microchip"
                                    value={puppy.microchip}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleDelete}
                            >
                                Delete puppy
                            </Button>
                        </Box>
                    </Box>
                </Grid>

                {/* Photos Section */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Photos</Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Upload photos
                        </Button>

                        {puppy.photo_url && (
                            <Box sx={{ position: 'relative', mb: 2 }}>
                                <img
                                    src={puppy.photo_url}
                                    alt={puppy.name}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '4px'
                                    }}
                                />
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    display: 'flex',
                                    gap: 1
                                }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                    >
                                        Set as cover
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                    >
                                        Edit
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PuppyDetails; 