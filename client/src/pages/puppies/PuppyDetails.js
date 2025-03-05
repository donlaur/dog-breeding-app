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
import PuppyForm from './PuppyForm';

const PuppyDetails = () => {
    const { puppyId } = useParams();
    const navigate = useNavigate();
    const { puppies, litters, refreshData } = useDog();
    const [puppy, setPuppy] = useState(null);
    const [parentLitter, setParentLitter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isAddMode = !puppyId || puppyId === 'add';

    useEffect(() => {
        // Only fetch puppy details if we have an ID and we're not in add mode
        if (!isAddMode) {
            fetchPuppyDetails();
        } else {
            // In add mode, initialize with an empty puppy
            setPuppy({});
            setLoading(false);
        }
    }, [puppyId]);

    const fetchPuppyDetails = async () => {
        // Don't try to fetch if there's no ID or if it's "add"
        if (isAddMode) return;
        
        setLoading(true);
        setError(null);
        
        try {
            console.log(`Fetching puppy details for ID: ${puppyId}`);
            const response = await apiGet(`puppies/${puppyId}`);
            if (response && response.ok && response.data) {
                setPuppy(response.data);
                
                // If we have the puppy, try to find its litter
                if (litters && litters.length > 0 && response.data.litter_id) {
                    const foundLitter = litters.find(l => 
                        String(l.id) === String(response.data.litter_id)
                    );
                    if (foundLitter) {
                        setParentLitter(foundLitter);
                    }
                }
            } else {
                throw new Error(response?.error || "Failed to fetch puppy data");
            }
        } catch (err) {
            console.error('Error fetching puppy details:', err);
            setError('Failed to load puppy details. Please try again.');
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
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {isAddMode ? 'Add New Puppy' : 'Puppy Details'}
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                    <PuppyForm 
                        initialData={puppy || {}} 
                        onSave={handleSave} 
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default PuppyDetails; 