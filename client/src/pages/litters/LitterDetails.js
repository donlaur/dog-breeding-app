import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Box,
    Chip,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { API_URL } from '../../config';
import { formatDate, calculateAge } from '../../utils/dateUtils';
import { getPhotoUrl } from '../../utils/photoUtils';

const LitterDetails = () => {
    const { litterId } = useParams();
    const [litter, setLitter] = useState(null);
    const [puppies, setPuppies] = useState([]);
    const [sire, setSire] = useState(null);
    const [dam, setDam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLitterDetails = async () => {
            try {
                const [litterRes, puppiesRes, dogsRes] = await Promise.all([
                    fetch(`${API_URL}/litters/${litterId}`),
                    fetch(`${API_URL}/litters/${litterId}/puppies`),
                    fetch(`${API_URL}/dogs/`)
                ]);

                const litterData = await litterRes.json();
                const puppiesData = await puppiesRes.json();
                const dogsData = await dogsRes.json();

                setLitter(litterData);
                setPuppies(puppiesData);
                
                // Find sire and dam using their IDs
                const foundSire = dogsData.find(dog => dog.id === litterData.sire_id);
                const foundDam = dogsData.find(dog => dog.id === litterData.dam_id);
                
                console.log('Found sire:', foundSire);
                console.log('Found dam:', foundDam);
                
                setSire(foundSire);
                setDam(foundDam);
                
            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLitterDetails();
    }, [litterId]);

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!litter) return <Typography>Litter not found</Typography>;

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                {/* Litter Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        {litter.litter_name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Born: {formatDate(litter.birth_date)} ({calculateAge(litter.birth_date)})
                    </Typography>
                </Box>

                {/* Parents Section */}
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Sire (Father)</Typography>
                                {sire && (
                                    <>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={sire.cover_photo || '/default-dog.jpg'}
                                            alt={sire.call_name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <Typography>{sire.call_name}</Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Dam (Mother)</Typography>
                                {dam && (
                                    <>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={dam.cover_photo || '/default-dog.jpg'}
                                            alt={dam.call_name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <Typography>{dam.call_name}</Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 4 }} />

                {/* Litter Details */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>Litter Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Status:</strong> {litter.status}</Typography>
                            <Typography><strong>Number of Puppies:</strong> {litter.num_puppies}</Typography>
                            <Typography><strong>Price:</strong> ${litter.price}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Deposit:</strong> ${litter.deposit}</Typography>
                            <Typography><strong>Available:</strong> {formatDate(litter.availability_date)}</Typography>
                        </Grid>
                    </Grid>
                </Box>

                {/* Puppies Section */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Puppies in this Litter</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        to={`/dashboard/litters/${litterId}/add-puppy`}
                    >
                        Add Puppy
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {puppies.map((puppy) => (
                        <Grid item xs={12} sm={6} md={4} key={puppy.id}>
                            <Card>
                                {puppy.photo_url && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={getPhotoUrl(puppy.photo_url)}
                                        alt={puppy.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6">
                                        {puppy.name || `Puppy ${puppy.collar_color}`}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {puppy.gender} • {puppy.color}
                                    </Typography>
                                    <Box mt={1}>
                                        <Chip 
                                            label={puppy.is_available ? "Available" : "Not Available"} 
                                            color={puppy.is_available ? "success" : "default"}
                                        />
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button 
                                        size="small" 
                                        component={Link} 
                                        to={`/dashboard/puppies/${puppy.id}`}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Container>
    );
};

export default LitterDetails; 