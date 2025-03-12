import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  Paper, 
  Chip, 
  Button, 
  Box, 
  CircularProgress, 
  Divider,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Stack,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import MedicationIcon from '@mui/icons-material/Medication';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TableCell } from '@mui/material';
import PhotoGallery from '../../components/PhotoGallery';
import { useHealth } from '../../context/HealthContext';
import HealthAnalytics from '../../components/health/HealthAnalytics';
import HealthReportPrinter from '../../components/health/HealthReportPrinter';
import { useReactToPrint } from 'react-to-print';
import { apiGet } from '../../utils/apiUtils';
import { getPhotoUrl, DEFAULT_DOG_IMAGE, handleImageError } from '../../utils/photoUtils';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dog-tabpanel-${index}`}
      aria-labelledby={`dog-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DogDetails = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: dogId } = useParams(); // Extract 'id' from URL params
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siredLitters, setSiredLitters] = useState([]);
  const [damLitters, setDamLitters] = useState([]);
  const [heatCycles, setHeatCycles] = useState([]);
  const [loadingLitters, setLoadingLitters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { healthRecords, vaccinations, medicationRecords, dashboardData } = useHealth();
  const reportComponentRef = React.useRef();

  // Filter health data specific to this dog
  const dogHealthData = React.useMemo(() => {
    return {
      healthRecords: healthRecords.filter(r => r && r.dog_id && r.dog_id.toString() === dogId.toString()),
      vaccinations: vaccinations.filter(v => v && v.dog_id && v.dog_id.toString() === dogId.toString()),
      medicationRecords: medicationRecords.filter(m => m && m.dog_id && m.dog_id.toString() === dogId.toString())
    };
  }, [healthRecords, vaccinations, medicationRecords, dogId]);

  // Handle printing health report
  const handlePrintHealthReport = useReactToPrint({
    content: () => reportComponentRef.current,
  });

  useEffect(() => {
    console.log('DogDetails component mounted, dogId:', dogId);
    fetchDogDetails();
    
    // Add cleanup function
    return () => {
      console.log('DogDetails component unmounting');
    };
  }, [dogId]);

  const fetchDogDetails = async () => {
    if (!dogId) return;
    
    setLoading(true);
    setError(null); // Clear any previous errors
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempting to fetch dog details for ID: ${dogId} (Attempt ${retries + 1}/${maxRetries})`);
        
        const result = await apiGet(`dogs/${dogId}`);
        console.log('API response:', result);
        
        // Extract the actual dog data - the API might wrap it in a data property
        const dogData = result.data ? result.data : result;
        
        console.log('Dog data extracted:', dogData);
        
        // Set the dog data directly
        setDog(dogData);
        
        // After setting dog data, fetch related information
        if (dogData && dogData.gender) {
          // Use the ID from the URL params for consistency
          fetchLitters(dogId, dogData.gender);
        }
        
        // If successful, exit the retry loop
        break;
      } catch (error) {
        console.error(`Error fetching dog details (Attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached. Could not fetch dog details.');
          setError(`Could not load dog details: ${error.message}. Please try again later.`);
        } else {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retries), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setLoading(false);
  };

  const fetchLitters = async (dogId, gender) => {
    if (!dogId) return;
    
    setLoadingLitters(true);
    let retries = 0;
    const maxRetries = 3;
    
    // Ensure gender value is capitalized correctly
    const normalizedGender = gender ? 
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : 
      'Unknown';
    
    console.log(`Fetching litters for dog ID: ${dogId}, Gender: ${normalizedGender}`);
    
    while (retries < maxRetries) {
      try {
        // Use the correct endpoints for sire and dam litters
        const endpoint = normalizedGender === 'Male' 
          ? `litters/sire/${dogId}` 
          : `litters/dam/${dogId}`;
        
        console.log(`Fetching ${normalizedGender === 'Male' ? 'sired' : 'dam'} litters from: ${endpoint} (Attempt ${retries + 1}/${maxRetries})`);
        
        const result = await apiGet(endpoint);
        console.log(`Litter API response:`, result);
        
        // Handle both direct array returns and {data: [...]} format
        const litterData = Array.isArray(result) ? result : 
                           (result && result.data && Array.isArray(result.data)) ? result.data : [];
        
        console.log(`Found ${litterData.length} ${normalizedGender === 'Male' ? 'sired' : 'dam'} litters`, litterData);
        
        if (normalizedGender === 'Male') {
          setSiredLitters(litterData);
        } else {
          setDamLitters(litterData);
        }
        
        // If successful, exit the retry loop
        break;
      } catch (error) {
        console.error(`Error fetching litters (Attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached. Could not fetch litters.');
          // Set empty arrays to avoid undefined errors
          if (normalizedGender === 'Male') {
            setSiredLitters([]);
          } else {
            setDamLitters([]);
          }
        } else {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retries), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setLoadingLitters(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    fetchDogDetails();
  };

  // Health-related helper functions
  const renderVaccinationStatus = () => {
    const dogVaccinations = vaccinations.filter(v => v.dog_id === dog.id);
    
    if (dogVaccinations.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          No vaccination records found for this dog.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vaccine</TableCell>
              <TableCell>Last Date</TableCell>
              <TableCell>Next Due</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dogVaccinations.map((vax) => {
              const lastDate = vax.date ? new Date(vax.date).toLocaleDateString() : 'N/A';
              const nextDueDate = vax.next_due_date ? new Date(vax.next_due_date).toLocaleDateString() : 'N/A';
              const today = new Date();
              const nextDue = vax.next_due_date ? new Date(vax.next_due_date) : null;
              
              let status = 'Up to date';
              let statusColor = 'success';
              
              if (nextDue) {
                if (nextDue < today) {
                  status = 'Overdue';
                  statusColor = 'error';
                } else if ((nextDue - today) / (1000 * 60 * 60 * 24) < 30) {
                  status = 'Due soon';
                  statusColor = 'warning';
                }
              }
              
              return (
                <TableRow key={vax.id}>
                  <TableCell>{vax.vaccine_name}</TableCell>
                  <TableCell>{lastDate}</TableCell>
                  <TableCell>{nextDueDate}</TableCell>
                  <TableCell>
                    <Chip label={status} color={statusColor} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderMedicationStatus = () => {
    const dogMedications = medicationRecords.filter(m => m.dog_id === dog.id);
    const activeMedications = dogMedications.filter(m => {
      // Check if medication is still active (end date is in the future or null)
      if (!m.end_date) return true;
      const endDate = new Date(m.end_date);
      return endDate >= new Date();
    });
    
    if (activeMedications.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          No active medications for this dog.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Medication</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeMedications.map((med) => (
              <TableRow key={med.id}>
                <TableCell>{med.medication_name}</TableCell>
                <TableCell>{med.dosage}</TableCell>
                <TableCell>{med.frequency}</TableCell>
                <TableCell>
                  {med.end_date 
                    ? new Date(med.end_date).toLocaleDateString() 
                    : 'Ongoing'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderHealthRecordsList = () => {
    const dogHealthRecords = healthRecords.filter(r => r.dog_id === dog.id);
    
    if (dogHealthRecords.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
          No health records available for this dog.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dogHealthRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={record.record_type || 'General'} 
                    size="small" 
                    color={
                      record.record_type === 'emergency' ? 'error' :
                      record.record_type === 'surgery' ? 'warning' :
                      record.record_type === 'checkup' ? 'success' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    component={Link} 
                    to={`/dashboard/health/records/edit/${record.id}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // If there's an error, show an error message with a retry button
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Dog Details
        </Typography>
        <Typography variant="body1" paragraph>
          {error}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleGoBack}
            startIcon={<ArrowBackIcon />}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dog) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Error loading dog details</Typography>
        <Button component={Link} to="/dashboard/dogs" sx={{ mt: 2 }}>
          Return to Dogs List
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back button and Edit button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handleGoBack}>
          <ArrowBackIcon />
        </IconButton>
        <Button 
          variant="outlined" 
          startIcon={<EditIcon />}
          component={Link}
          to={`/dashboard/dogs/${dog.id}/edit`}
        >
          Edit
        </Button>
      </Box>

      {/* Dog header with photo and basic info */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mb: 3 }}>
        <Box sx={{ 
          width: { xs: '100%', md: '30%' }, 
          minWidth: { md: 300 },
          mr: { md: 3 },
          mb: { xs: 2, md: 0 }
        }}>
          <Card>
            <CardMedia
              component="img"
              height="250"
              image={getPhotoUrl(dog.cover_photo, 'DOG')}
              alt={dog.call_name || 'Dog'}
              sx={{ objectFit: 'cover' }}
              onError={e => handleImageError('DOG')(e)}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                  {dog.call_name || 'Unknown Dog'}
                </Typography>
                <Chip 
                  icon={dog.gender?.toLowerCase() === 'male' ? <MaleIcon /> : <FemaleIcon />}
                  label={dog.gender || 'Unknown'}
                  color={dog.gender?.toLowerCase() === 'male' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>
              {dog.registered_name && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                  {dog.registered_name}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Breed:</strong> {dog.breed || 'Not specified'}
                </Typography>
                {dog.date_of_birth && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Born:</strong> {new Date(dog.date_of_birth).toLocaleDateString()}
                  </Typography>
                )}
                {dog.color && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Color:</strong> {dog.color}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="dog details tabs">
              <Tab label="Overview" />
              <Tab label="Health" />
              <Tab label="Breeding" />
              <Tab label="Documents" />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>Dog Information</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                {dog.description || 'No description available for this dog.'}
              </Typography>
              
              <Grid container spacing={2}>
                {dog.akc_number && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>AKC Number:</strong> {dog.akc_number}
                    </Typography>
                  </Grid>
                )}
                {dog.microchip && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Microchip:</strong> {dog.microchip}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </TabPanel>

          {/* Health Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} /> 
                Health Overview
              </Typography>
              
              {/* Health action buttons */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link}
                  to={`/dashboard/health/records/add?dogId=${dog.id}`}
                  startIcon={<AddIcon />}
                >
                  Add Health Record
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  component={Link}
                  to={`/dashboard/health/vaccinations/add?dogId=${dog.id}`}
                  startIcon={<VaccinesIcon />}
                >
                  Add Vaccination
                </Button>
                <Button 
                  variant="outlined" 
                  color="info" 
                  component={Link}
                  to={`/dashboard/health/medications/add?dogId=${dog.id}`}
                  startIcon={<MedicationIcon />}
                >
                  Add Medication
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handlePrintHealthReport}
                  startIcon={<PrintIcon />}
                >
                  Print Health Report
                </Button>
              </Stack>
              
              {/* Health alerts for this specific dog */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Health Alerts for {dog.call_name}
                </Typography>
                {/* Use the existing DogSpecificHealthAlerts component defined at the bottom of this file */}
                <DogSpecificHealthAlerts dogId={dog.id} />
              </Box>
              
              {/* Health Summary */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Vaccination Status</Typography>
                      {renderVaccinationStatus()}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Current Medications</Typography>
                      {renderMedicationStatus()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Health records list */}
              <Typography variant="h6" gutterBottom>Health Records</Typography>
              {renderHealthRecordsList()}
              
              {/* Health Analytics */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Health Analytics</Typography>
                <HealthAnalytics dogId={dog.id} />
              </Box>
            </Box>
          </TabPanel>

          {/* Breeding Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PetsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {dog.gender?.toLowerCase() === 'male' ? 'Sired Litters' : 'Dam Litters'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ ml: 'auto' }}
                  component={Link}
                  to={`/dashboard/litters/new?${dog.gender?.toLowerCase() === 'male' ? 'sire_id' : 'dam_id'}=${dog.id}`}
                  startIcon={<AddIcon />}
                >
                  New Litter
                </Button>
              </Box>
              
              {loadingLitters ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : dog.gender?.toLowerCase() === 'male' && siredLitters && siredLitters.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>Dam</TableCell>
                        <TableCell>Whelp Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Puppies</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {siredLitters.map((litter) => (
                        <TableRow key={litter.id}>
                          <TableCell>
                            {litter.dam?.call_name || `Dam #${litter.dam_id || 'Unknown'}`}
                          </TableCell>
                          <TableCell>
                            {litter.whelp_date ? new Date(litter.whelp_date).toLocaleDateString() : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={litter.status || 'Unknown'} 
                              color={litter.status === 'Born' ? 'success' : 'primary'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{litter.num_puppies || 0}</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="contained"
                              component={Link}
                              to={`/dashboard/litters/${litter.id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : dog.gender?.toLowerCase() === 'female' && damLitters && damLitters.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>Sire</TableCell>
                        <TableCell>Whelp Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Puppies</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {damLitters.map((litter) => (
                        <TableRow key={litter.id}>
                          <TableCell>
                            {litter.sire?.call_name || `Sire #${litter.sire_id || 'Unknown'}`}
                          </TableCell>
                          <TableCell>
                            {litter.whelp_date ? new Date(litter.whelp_date).toLocaleDateString() : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={litter.status || 'Unknown'} 
                              color={litter.status === 'Born' ? 'success' : 'primary'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{litter.num_puppies || 0}</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="contained"
                              component={Link}
                              to={`/dashboard/litters/${litter.id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No litters {dog.gender?.toLowerCase() === 'male' ? 'sired by this dog' : 'recorded for this dam'} yet.
                </Typography>
              )}
              
              {dog.gender?.toLowerCase() === 'female' && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6">Heat Cycles</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ ml: 'auto' }}
                      component={Link}
                      to={`/dashboard/heats/manage?dogId=${dog.id}`}
                    >
                      Manage Heats
                    </Button>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    {heatCycles && heatCycles.length > 0 
                      ? `${heatCycles.length} heat cycles recorded.` 
                      : 'No heat cycles recorded for this dog.'}
                  </Typography>
                </>
              )}
            </Box>
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom>Documents</Typography>
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link}
                to={`/dashboard/documents/upload?dogId=${dog.id}`}
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
              >
                Upload Document
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                No documents available for this dog.
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>

      {/* Photo Gallery Section */}
      <Box sx={{ py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Photos</Typography>
        {dog && dog.id && (
          <PhotoGallery 
            entityType="dog" 
            entityId={dog.id.toString()} 
            maxPhotos={25}
            gridCols={{ xs: 12, sm: 6, md: 4, lg: 3 }}
          />
        )}
      </Box>

      {/* Health Report */}
      <DogHealthReport ref={reportComponentRef} dog={dog} dogHealthData={dogHealthData} />
    </Box>
  );
};

// Create a dog-specific health report printer
const DogHealthReport = React.forwardRef(({ dog, dogHealthData }, ref) => {
  const { vaccinations, medicationRecords, healthRecords } = dogHealthData;
  
  return (
    <Box ref={ref} sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>Health Report</Typography>
        {dog.cover_photo && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img 
              src={getPhotoUrl(dog.cover_photo, 'DOG')} 
              alt={dog.call_name} 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover', 
                borderRadius: '75px',
                border: '3px solid #f5f5f5'
              }}
              onError={handleImageError('DOG')}
            />
          </Box>
        )}
        <Typography variant="h5">{dog.call_name}</Typography>
        {dog.registered_name && (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {dog.registered_name}
          </Typography>
        )}
        <Typography variant="body2">
          Breed: {dog.breed} • Gender: {dog.gender} • DOB: {dog.date_of_birth ? new Date(dog.date_of_birth).toLocaleDateString() : 'Unknown'}
        </Typography>
        {dog.microchip && (
          <Typography variant="body2">
            Microchip: {dog.microchip}
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Health Records Summary */}
      <Typography variant="h6" gutterBottom>Health Records</Typography>
      {healthRecords.length === 0 ? (
        <Typography variant="body2" sx={{ mb: 3 }}>No health records available.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{record.record_type || 'General'}</TableCell>
                  <TableCell>{record.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Vaccinations */}
      <Typography variant="h6" gutterBottom>Vaccination History</Typography>
      {vaccinations.length === 0 ? (
        <Typography variant="body2" sx={{ mb: 3 }}>No vaccination records available.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vaccine</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vaccinations.map((vax) => (
                <TableRow key={vax.id}>
                  <TableCell>{vax.vaccine_name}</TableCell>
                  <TableCell>{vax.date ? new Date(vax.date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{vax.next_due_date ? new Date(vax.next_due_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{vax.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Medications */}
      <Typography variant="h6" gutterBottom>Medication History</Typography>
      {medicationRecords.length === 0 ? (
        <Typography variant="body2" sx={{ mb: 3 }}>No medication records available.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Medication</TableCell>
                <TableCell>Dosage</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Frequency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicationRecords.map((med) => (
                <TableRow key={med.id}>
                  <TableCell>{med.medication_name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.start_date ? new Date(med.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{med.end_date ? new Date(med.end_date).toLocaleDateString() : 'Ongoing'}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Report Footer */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
});

// Create a dog-specific health alerts component
const DogSpecificHealthAlerts = ({ dogId }) => {
  const { dashboardData } = useHealth();
  const [dogAlerts, setDogAlerts] = useState([]);
  
  useEffect(() => {
    if (!dashboardData) return;
    
    // Filter alerts to only show those related to this dog
    const filteredAlerts = [];
    
    // Check upcoming vaccinations
    if (dashboardData.upcoming_vaccinations && dashboardData.upcoming_vaccinations.items) {
      const dogVaxAlerts = (dashboardData.upcoming_vaccinations.items || [])
        .filter(vax => vax && vax.dog_id === dogId)
        .map(vax => ({
          id: `vax-${vax.id}`,
          type: 'vaccination',
          severity: 'warning',
          title: `${vax.vaccine_name || 'Unknown'} vaccination due`,
          description: `${vax.vaccine_name || 'Unknown'} vaccination is due on ${vax.next_due_date ? new Date(vax.next_due_date).toLocaleDateString() : 'unknown date'}`,
          date: vax.next_due_date
        }));
      
      filteredAlerts.push(...dogVaxAlerts);
    }
    
    // Check active medications
    if (dashboardData.active_medications && dashboardData.active_medications.items) {
      const dogMedAlerts = (dashboardData.active_medications.items || [])
        .filter(med => med && med.dog_id === dogId)
        .map(med => ({
          id: `med-${med.id}`,
          type: 'medication',
          severity: 'info',
          title: `${med.medication_name || 'Unknown'} administration`,
          description: `${med.medication_name || 'Unknown'} ${med.dosage ? `(${med.dosage})` : ''} ${med.frequency ? `- ${med.frequency}` : ''}`,
          date: med.end_date
        }));
      
      filteredAlerts.push(...dogMedAlerts);
    }
    
    // Check active health conditions
    if (dashboardData.active_conditions && dashboardData.active_conditions.items) {
      const dogConditionAlerts = (dashboardData.active_conditions.items || [])
        .filter(condition => condition && condition.dog_id === dogId)
        .map(condition => ({
          id: `condition-${condition.id}`,
          type: 'condition',
          severity: condition.is_critical ? 'error' : 'warning',
          title: `${condition.condition_name || 'Unknown condition'}`,
          description: `Ongoing health condition: ${condition.condition_name || 'Unknown'}${condition.notes ? ` - ${condition.notes}` : ''}`,
          date: condition.diagnosis_date
        }));
      
      filteredAlerts.push(...dogConditionAlerts);
    }
    
    setDogAlerts(filteredAlerts);
  }, [dashboardData, dogId]);
  
  if (!dogAlerts || dogAlerts.length === 0) {
    return (
      <Alert severity="success" sx={{ mt: 1, mb: 2 }}>
        No health alerts for this dog.
      </Alert>
    );
  }
  
  return (
    <Box>
      {dogAlerts.map(alert => (
        <Alert 
          key={alert.id} 
          severity={alert.severity || 'info'}
          variant="outlined"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">{alert.title}</Typography>
          <Typography variant="body2">{alert.description}</Typography>
        </Alert>
      ))}
    </Box>
  );
};

export default DogDetails;