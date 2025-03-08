import React, { useState, useRef } from 'react';
import { 
  Paper, Typography, Box, Button, Select, MenuItem, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import { Print as PrintIcon, PictureAsPdf as PdfIcon, FileDownload as DownloadIcon } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';

const HealthReportPrinter = () => {
  const [open, setOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [selectedAnimal, setSelectedAnimal] = useState('all');
  const [dateRange, setDateRange] = useState('last3Months');
  const [includeImages, setIncludeImages] = useState(true);
  
  const { healthRecords, vaccinations, medicationRecords, healthConditions } = useHealth();
  const { dogs, puppies } = useDog();
  
  const printRef = useRef();
  
  const allAnimals = [
    { id: 'all', name: 'All Animals', type: 'all' },
    ...dogs.map(dog => ({ id: `dog-${dog.id}`, name: dog.call_name || `Dog ${dog.id}`, type: 'dog', data: dog })),
    ...puppies.map(puppy => ({ id: `puppy-${puppy.id}`, name: puppy.name || `Puppy ${puppy.id}`, type: 'puppy', data: puppy }))
  ];
  
  const getDateRangeFilter = () => {
    const today = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'last30Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last3Months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'last6Months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'lastYear':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    return startDate;
  };
  
  const getFilteredRecords = () => {
    const filterDate = getDateRangeFilter();
    let animalType, animalId;
    
    if (selectedAnimal !== 'all') {
      const [type, id] = selectedAnimal.split('-');
      animalType = type;
      animalId = id;
    }
    
    // Filter health records
    const filteredHealthRecords = healthRecords.filter(record => {
      // Date filter
      const recordDate = record.record_date ? new Date(record.record_date) : null;
      const passesDateFilter = !recordDate || recordDate >= filterDate;
      
      // Animal filter
      let passesAnimalFilter = true;
      if (animalType === 'dog') {
        passesAnimalFilter = record.dog_id === animalId;
      } else if (animalType === 'puppy') {
        passesAnimalFilter = record.puppy_id === animalId;
      }
      
      return passesDateFilter && passesAnimalFilter;
    });
    
    // Filter vaccinations
    const filteredVaccinations = vaccinations.filter(vax => {
      // Date filter
      const vaxDate = vax.administration_date ? new Date(vax.administration_date) : null;
      const passesDateFilter = !vaxDate || vaxDate >= filterDate;
      
      // Animal filter
      let passesAnimalFilter = true;
      if (animalType === 'dog') {
        passesAnimalFilter = vax.dog_id === animalId;
      } else if (animalType === 'puppy') {
        passesAnimalFilter = vax.puppy_id === animalId;
      }
      
      return passesDateFilter && passesAnimalFilter;
    });
    
    // Filter medications
    const filteredMedications = medicationRecords.filter(med => {
      // Date filter
      const startDate = med.start_date ? new Date(med.start_date) : null;
      const passesDateFilter = !startDate || startDate >= filterDate;
      
      // Animal filter
      let passesAnimalFilter = true;
      if (animalType === 'dog') {
        passesAnimalFilter = med.dog_id === animalId;
      } else if (animalType === 'puppy') {
        passesAnimalFilter = med.puppy_id === animalId;
      }
      
      return passesDateFilter && passesAnimalFilter;
    });
    
    // Filter health conditions
    const filteredConditions = healthConditions.filter(condition => {
      // Date filter
      const diagnosisDate = condition.diagnosed_date ? new Date(condition.diagnosed_date) : null;
      const passesDateFilter = !diagnosisDate || diagnosisDate >= filterDate;
      
      // Animal filter
      let passesAnimalFilter = true;
      if (animalType === 'dog') {
        passesAnimalFilter = condition.dog_id === animalId;
      } else if (animalType === 'puppy') {
        passesAnimalFilter = condition.puppy_id === animalId;
      }
      
      return passesDateFilter && passesAnimalFilter;
    });
    
    return {
      healthRecords: filteredHealthRecords,
      vaccinations: filteredVaccinations,
      medications: filteredMedications,
      conditions: filteredConditions
    };
  };
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeprint: () => setIsPrinting(true),
    onAfterPrint: () => {
      setIsPrinting(false);
      setOpen(false);
    },
    documentTitle: `Health Report - ${format(new Date(), 'yyyy-MM-dd')}`,
  });
  
  const getAnimalName = (item) => {
    if (item.dog_id) {
      const dog = dogs.find(d => d.id === item.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (item.puppy_id) {
      const puppy = puppies.find(p => p.id === item.puppy_id);
      return puppy ? puppy.name : 'Unknown Puppy';
    }
    return 'Unknown';
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString || 'Unknown Date';
    }
  };
  
  return (
    <>
      <Box my={2}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={() => setOpen(true)}
        >
          Generate Health Report
        </Button>
      </Box>
      
      <Dialog open={open} onClose={() => !isPrinting && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Health Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  id="report-type"
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="all">Complete Health Report</MenuItem>
                  <MenuItem value="vaccinations">Vaccinations Only</MenuItem>
                  <MenuItem value="medications">Medications Only</MenuItem>
                  <MenuItem value="conditions">Health Conditions Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="animal-select-label">Select Animal</InputLabel>
                <Select
                  labelId="animal-select-label"
                  id="animal-select"
                  value={selectedAnimal}
                  label="Select Animal"
                  onChange={(e) => setSelectedAnimal(e.target.value)}
                >
                  {allAnimals.map(animal => (
                    <MenuItem key={animal.id} value={animal.id}>{animal.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="date-range-label">Date Range</InputLabel>
                <Select
                  labelId="date-range-label"
                  id="date-range"
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="last30Days">Last 30 Days</MenuItem>
                  <MenuItem value="last3Months">Last 3 Months</MenuItem>
                  <MenuItem value="last6Months">Last 6 Months</MenuItem>
                  <MenuItem value="lastYear">Last Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    name="includeImages"
                  />
                }
                label="Include Images"
              />
            </Grid>
          </Grid>
          
          <Box mt={3} sx={{ display: 'none' }}>
            <div ref={printRef} style={{ padding: '20px' }}>
              {/* Print Preview Content */}
              <Box textAlign="center" mb={4}>
                <Typography variant="h4" gutterBottom>Health Report</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Generated on {format(new Date(), 'MMMM d, yyyy')}
                </Typography>
                <Typography variant="subtitle2">
                  {selectedAnimal === 'all' ? 'All Animals' : 
                    allAnimals.find(a => a.id === selectedAnimal)?.name}
                </Typography>
              </Box>
              
              {/* Filtered Report Content */}
              {(reportType === 'all' || reportType === 'vaccinations') && (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>Vaccinations</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {getFilteredRecords().vaccinations.length > 0 ? (
                      getFilteredRecords().vaccinations.map((vax) => (
                        <Box key={vax.id} mb={2} pb={2} sx={{ borderBottom: '1px solid #eee' }}>
                          <Typography variant="subtitle1">{vax.vaccine_name}</Typography>
                          <Typography variant="body2">
                            <strong>Animal:</strong> {getAnimalName(vax)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {formatDate(vax.administration_date)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Next Due:</strong> {formatDate(vax.next_due_date)}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No vaccination records found</Typography>
                    )}
                  </Paper>
                </Box>
              )}
              
              {(reportType === 'all' || reportType === 'medications') && (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>Medications</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {getFilteredRecords().medications.length > 0 ? (
                      getFilteredRecords().medications.map((med) => (
                        <Box key={med.id} mb={2} pb={2} sx={{ borderBottom: '1px solid #eee' }}>
                          <Typography variant="subtitle1">{med.medication_name}</Typography>
                          <Typography variant="body2">
                            <strong>Animal:</strong> {getAnimalName(med)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Dosage:</strong> {med.dosage || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Start Date:</strong> {formatDate(med.start_date)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>End Date:</strong> {formatDate(med.end_date)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> {med.status || 'Active'}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No medication records found</Typography>
                    )}
                  </Paper>
                </Box>
              )}
              
              {(reportType === 'all' || reportType === 'conditions') && (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>Health Conditions</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {getFilteredRecords().conditions.length > 0 ? (
                      getFilteredRecords().conditions.map((condition) => (
                        <Box key={condition.id} mb={2} pb={2} sx={{ borderBottom: '1px solid #eee' }}>
                          <Typography variant="subtitle1">{condition.condition_name}</Typography>
                          <Typography variant="body2">
                            <strong>Animal:</strong> {getAnimalName(condition)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Diagnosed:</strong> {formatDate(condition.diagnosed_date)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Status:</strong> {condition.status || 'Unknown'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Severity:</strong> {condition.severity || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Notes:</strong> {condition.notes || 'No notes'}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No health conditions found</Typography>
                    )}
                  </Paper>
                </Box>
              )}
              
              {reportType === 'all' && (
                <Box mb={4}>
                  <Typography variant="h5" gutterBottom>Health Records</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {getFilteredRecords().healthRecords.length > 0 ? (
                      getFilteredRecords().healthRecords.map((record) => (
                        <Box key={record.id} mb={2} pb={2} sx={{ borderBottom: '1px solid #eee' }}>
                          <Typography variant="subtitle1">{record.title}</Typography>
                          <Typography variant="body2">
                            <strong>Animal:</strong> {getAnimalName(record)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {formatDate(record.record_date)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Type:</strong> {record.record_type || 'General'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Provider:</strong> {record.provider || 'Not specified'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Description:</strong> {record.description || 'No description'}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No health records found</Typography>
                    )}
                  </Paper>
                </Box>
              )}
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            color="inherit"
            disabled={isPrinting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            color="primary"
            variant="contained"
            startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
            disabled={isPrinting}
          >
            {isPrinting ? 'Printing...' : 'Print Report'}
          </Button>
          <Button
            color="secondary"
            variant="contained"
            startIcon={<PdfIcon />}
            disabled={isPrinting}
          >
            Export as PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HealthReportPrinter;
