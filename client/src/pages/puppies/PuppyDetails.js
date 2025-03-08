import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDog } from '../../context/DogContext';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Box,
    Card,
    CardContent,
    Divider,
    Breadcrumbs,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Chip
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Female as FemaleIcon,
    Male as MaleIcon,
    Cake as CakeIcon,
    Palette as ColorIcon
} from '@mui/icons-material';
import { apiGet, apiPut, apiDelete } from '../../utils/apiUtils';
import PuppyForm from './PuppyForm';
import { formatDate } from '../../utils/dateUtils';
import { showSuccess, showError } from '../../utils/notifications';
import PhotoGallery from '../../components/PhotoGallery';

const PuppyDetails = ({ isEdit = false }) => {
    const { id: puppyId } = useParams(); // Extract 'id' from URL params
    const navigate = useNavigate();
    const { puppies, litters, refreshData } = useDog();
    const [puppy, setPuppy] = useState(null);
    const [parentLitter, setParentLitter] = useState(null);
    const [siblingPuppies, setSiblingPuppies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(isEdit);
    const isAddMode = !puppyId || puppyId === 'add';

    useEffect(() => {
        // Only fetch puppy details if we have an ID and we're not in add mode
        if (!isAddMode) {
            fetchPuppyDetails();
        } else {
            // In add mode, initialize with an empty puppy
            setPuppy({});
            setLoading(false);
            setEditMode(true); // Always start in edit mode when adding
        }
    }, [puppyId, isAddMode]);

    const fetchPuppyDetails = async () => {
        // Don't try to fetch if there's no ID or if it's "add"
        if (isAddMode) return;
        
        setLoading(true);
        setError(null);
        
        try {
            console.log(`Fetching puppy details for ID: ${puppyId}`);
            const response = await apiGet(`puppies/${puppyId}`);
            
            // Check if the response is valid
            if (!response.ok) {
                console.error("API error:", response.error);
                throw new Error(response.error || `Puppy with ID ${puppyId} not found`);
            }
            
            if (!response.data) {
                throw new Error(`No data returned for puppy ID ${puppyId}`);
            }
            
            console.log("Received puppy data:", response.data);
            setPuppy(response.data);
            
            // If we have the puppy, try to find its litter and siblings
            if (response.data.litter_id) {
                const litterId = response.data.litter_id;
                console.log(`Fetching litter details for litter ID: ${litterId}`);
                
                // First check if we already have it in context
                let foundLitter = null;
                if (litters && litters.length > 0) {
                    foundLitter = litters.find(l => 
                        String(l.id) === String(litterId)
                    );
                    if (foundLitter) {
                        setParentLitter(foundLitter);
                    }
                }
                
                // If not found in context, fetch directly
                if (!foundLitter) {
                    const litterResponse = await apiGet(`litters/${litterId}`);
                    if (litterResponse.ok && litterResponse.data) {
                        foundLitter = litterResponse.data;
                        setParentLitter(foundLitter);
                    }
                }
                
                // Fetch all puppies in this litter (siblings)
                console.log(`Fetching siblings for litter ID: ${litterId}`);
                const siblingsResponse = await apiGet(`litters/${litterId}/puppies`);
                if (siblingsResponse.ok && siblingsResponse.data) {
                    // Filter out the current puppy from siblings
                    const siblings = siblingsResponse.data.filter(p => 
                        String(p.id) !== String(puppyId)
                    );
                    console.log(`Found ${siblings.length} siblings`);
                    setSiblingPuppies(siblings);
                }
            }
        } catch (err) {
            console.error('Error fetching puppy details:', err);
            setError(`Failed to load puppy: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedPuppy) => {
        try {
            setLoading(true);
            console.log("Saving puppy with data:", updatedPuppy);
            
            // Make sure we have the litter_id included
            if (puppy.litter_id && !updatedPuppy.litter_id) {
                updatedPuppy.litter_id = puppy.litter_id;
            }
            
            // Clean up numeric fields
            const numericFields = ['weight_at_birth', 'weight', 'price'];
            numericFields.forEach(field => {
                if (field in updatedPuppy) {
                    if (updatedPuppy[field] === '' || updatedPuppy[field] === undefined) {
                        updatedPuppy[field] = null;
                    } else if (typeof updatedPuppy[field] === 'string') {
                        updatedPuppy[field] = parseFloat(updatedPuppy[field]);
                    }
                }
            });
            
            // Use the apiPut utility
            const response = await apiPut(`puppies/${puppyId}`, updatedPuppy);
            
            if (!response.ok) {
                throw new Error(response.error || "Failed to save puppy");
            }
            
            showSuccess("Puppy updated successfully!");
            setPuppy(response.data || updatedPuppy);
            setEditMode(false); // Exit edit mode after successful save
            refreshData(); // Refresh context data
        } catch (error) {
            console.error("Error saving puppy:", error);
            showError(`Failed to save changes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this puppy?')) {
            try {
                setLoading(true);
                // Use the apiDelete utility
                const response = await apiDelete(`puppies/${puppyId}`);
                
                if (!response.ok) {
                    throw new Error(response.error || "Failed to delete puppy");
                }
                
                showSuccess("Puppy deleted successfully");
                refreshData(); // Refresh context data
                
                // Navigate back to litter if we have a parent litter
                if (parentLitter) {
                    navigate(`/dashboard/litters/${parentLitter.id}`);
                } else {
                    navigate('/dashboard/litters');
                }
            } catch (error) {
                console.error("Error deleting puppy:", error);
                showError(`Failed to delete puppy: ${error.message}`);
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        component={Link} 
                        to="/dashboard/litters"
                        variant="contained"
                    >
                        Back to Litters
                    </Button>
                </Box>
            </Container>
        );
    }

    // For view mode, render details in a nice format
    if (!editMode) {
        return (
            <Container maxWidth="md" sx={{ my: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <CircularProgress />
                    </Box>
                ) : !puppy ? (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" color="error">Error loading puppy details</Typography>
                        <Button component={Link} to="/dashboard/puppies" sx={{ mt: 2 }}>
                            Return to Puppies List
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 3 }}>
                            {parentLitter && (
                                <Button 
                                    component={Link} 
                                    to={`/dashboard/litters/${parentLitter.id}`}
                                    startIcon={<ArrowBackIcon />}
                                    sx={{ mb: 2 }}
                                >
                                    Back to Litter
                                </Button>
                            )}
                        </Box>
                        
                        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h4" component="h1">
                                    {puppy?.name || `Puppy #${puppyId}`}
                                </Typography>
                                
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit Puppy
                                </Button>
                            </Box>
                            
                            {puppy.status && (
                                <Chip 
                                    label={puppy.status} 
                                    color={
                                        puppy.status === 'Available' ? 'success' : 
                                        puppy.status === 'Reserved' ? 'warning' : 
                                        puppy.status === 'Sold' ? 'primary' : 'default'
                                    }
                                    sx={{ mb: 2 }}
                                />
                            )}
                            
                            {parentLitter && (
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    From litter: {parentLitter.litter_name || `Litter #${parentLitter.id}`}
                                </Typography>
                            )}
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                                Basic Information
                                            </Typography>
                                            
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                                                                Gender
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    {puppy.gender === 'Male' ? (
                                                                        <MaleIcon color="primary" sx={{ mr: 1 }} />
                                                                    ) : puppy.gender === 'Female' ? (
                                                                        <FemaleIcon color="error" sx={{ mr: 1 }} />
                                                                    ) : null}
                                                                    {puppy.gender || 'Not specified'}
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        <TableRow>
                                                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                Color
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <ColorIcon sx={{ mr: 1 }} />
                                                                    {puppy.color || 'Not specified'}
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        <TableRow>
                                                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                Birth Date
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <CakeIcon sx={{ mr: 1 }} />
                                                                    {puppy.birth_date ? formatDate(puppy.birth_date) : 'Not specified'}
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        {puppy.weight_at_birth && (
                                                            <TableRow>
                                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                    Birth Weight
                                                                </TableCell>
                                                                <TableCell>
                                                                    {puppy.weight_at_birth} oz
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        
                                                        {parentLitter && parentLitter.dam && (
                                                            <TableRow>
                                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                    Dam (Mother)
                                                                </TableCell>
                                                                <TableCell>
                                                                    {parentLitter.dam.call_name || 
                                                                     parentLitter.dam.name || 
                                                                     `Dam #${parentLitter.dam_id}`}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        
                                                        {parentLitter && parentLitter.sire && (
                                                            <TableRow>
                                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                    Sire (Father)
                                                                </TableCell>
                                                                <TableCell>
                                                                    {parentLitter.sire.call_name || 
                                                                     parentLitter.sire.name || 
                                                                     `Sire #${parentLitter.sire_id}`}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        
                                                        {puppy.microchip && (
                                                            <TableRow>
                                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                    Microchip
                                                                </TableCell>
                                                                <TableCell>
                                                                    {puppy.microchip}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        
                                                        {puppy.markings && (
                                                            <TableRow>
                                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                                                                    Markings
                                                                </TableCell>
                                                                <TableCell>
                                                                    {puppy.markings}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Additional Details
                                            </Typography>
                                            
                                            {puppy.notes ? (
                                                <Typography variant="body2" paragraph>
                                                    {puppy.notes}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No additional notes for this puppy.
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                        
                        {/* Photo Gallery Section */}
                        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Photos
                            </Typography>
                            {puppy && puppy.id && (
                                <PhotoGallery 
                                    entityType="puppy" 
                                    entityId={puppy.id} 
                                    maxPhotos={25}
                                    gridCols={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                                />
                            )}
                        </Paper>
                        
                        {/* Siblings Section */}
                        {siblingPuppies.length > 0 && (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h5" gutterBottom>
                                    Siblings
                                </Typography>
                                <Grid container spacing={2}>
                                    {siblingPuppies.map(sibling => (
                                        <Grid item xs={12} sm={6} md={4} key={sibling.id}>
                                            <Card 
                                                variant="outlined" 
                                                sx={{ 
                                                    height: '100%', 
                                                    transition: 'transform 0.2s', 
                                                    '&:hover': { 
                                                        transform: 'scale(1.02)',
                                                        boxShadow: 2
                                                    }
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography variant="h6">
                                                        {sibling.name || `Puppy #${sibling.id}`}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                                                        {sibling.gender === 'Male' ? (
                                                            <MaleIcon color="primary" sx={{ mr: 1 }} />
                                                        ) : sibling.gender === 'Female' ? (
                                                            <FemaleIcon color="error" sx={{ mr: 1 }} />
                                                        ) : null}
                                                        <Typography variant="body2" color="text.secondary">
                                                            {sibling.gender || 'Unknown'} • {sibling.color || 'Unknown color'}
                                                        </Typography>
                                                    </Box>
                                                    {sibling.status && (
                                                        <Chip 
                                                            label={sibling.status} 
                                                            size="small" 
                                                            color={
                                                                sibling.status === 'Available' ? 'success' : 
                                                                sibling.status === 'Reserved' ? 'warning' : 
                                                                sibling.status === 'Sold' ? 'primary' : 'default'
                                                            }
                                                            sx={{ mb: 1 }}
                                                        />
                                                    )}
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                        component={Link}
                                                        to={`/dashboard/puppies/${sibling.id}`}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleDelete}
                            >
                                Delete Puppy
                            </Button>
                            
                            <Button
                                variant="contained"
                                onClick={() => setEditMode(true)}
                                startIcon={<EditIcon />}
                            >
                                Edit Details
                            </Button>
                        </Box>
                    </>
                )}
            </Container>
        );
    }

    // For edit mode, render the form
    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3 }}>
                {parentLitter && (
                    <Button 
                        component={Link} 
                        to={`/dashboard/litters/${parentLitter.id}`}
                        startIcon={<ArrowBackIcon />}
                        sx={{ mb: 2 }}
                    >
                        Back to Litter
                    </Button>
                )}
            </Box>
            
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        {isAddMode ? 'Add New Puppy' : `Edit Puppy: ${puppy?.name || `#${puppyId}`}`}
                    </Typography>
                    
                    {!isAddMode && (
                        <Button
                            variant="outlined"
                            onClick={() => setEditMode(false)}
                        >
                            Cancel
                        </Button>
                    )}
                </Box>
                
                {parentLitter && (
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        From litter: {parentLitter.litter_name || `Litter #${parentLitter.id}`}
                    </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mt: 3 }}>
                    <PuppyForm 
                        initialData={puppy || {}} 
                        onSave={handleSave} 
                        litter={parentLitter}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default PuppyDetails; 