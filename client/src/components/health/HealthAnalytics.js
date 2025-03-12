import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';

/**
 * HealthAnalytics component to display health trends and statistics
 * @param {Object} props - Component properties
 * @param {string} [props.dogId] - Optional dog ID to filter records
 */
const HealthAnalytics = ({ dogId }) => {
  const { healthRecords = [], vaccinations = [], medicationRecords = [], weightRecords = [] } = useHealth();
  const { dogs = [], puppies = [] } = useDog();
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('recordTypes');
  const [timeFrame, setTimeFrame] = useState('6months');
  
  // Filter records for specific dog if dogId is provided
  const filteredHealthRecords = dogId 
    ? healthRecords.filter(record => record.dog_id === dogId)
    : healthRecords;
  
  const filteredVaccinations = dogId 
    ? vaccinations.filter(vax => vax.dog_id === dogId)
    : vaccinations;
  
  const filteredMedicationRecords = dogId 
    ? medicationRecords.filter(med => med.dog_id === dogId)
    : medicationRecords;

  // Process health data based on selected chart type and time frame
  useEffect(() => {
    const processData = () => {
      if (chartType === 'recordTypes') {
        // Create chart data for record types distribution
        const types = {};
        filteredHealthRecords.forEach(record => {
          const type = record.record_type || 'unknown';
          types[type] = (types[type] || 0) + 1;
        });
        
        const data = Object.keys(types).map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
          count: types[key]
        }));
        
        setChartData(data);
      } else if (chartType === 'vaccinationStatus') {
        if (dogId) {
          // For a specific dog, just count its vaccinations
          const vaccinationTypes = {};
          filteredVaccinations.forEach(vax => {
            const type = vax.vaccine_name || 'Unknown';
            vaccinationTypes[type] = (vaccinationTypes[type] || 0) + 1;
          });
          
          const data = Object.keys(vaccinationTypes).map(key => ({
            name: key,
            count: vaccinationTypes[key]
          }));
          
          setChartData(data);
        } else {
          // Calculate vaccination status for all animals
          const totalAnimals = dogs.length + puppies.length;
          const fullyVaccinated = dogs.filter(dog => dog && dog.vaccination_status === 'complete').length +
                                  puppies.filter(puppy => puppy && puppy.vaccination_status === 'complete').length;
          const partiallyVaccinated = dogs.filter(dog => dog && dog.vaccination_status === 'partial').length +
                                      puppies.filter(puppy => puppy && puppy.vaccination_status === 'partial').length;
          const notVaccinated = totalAnimals - fullyVaccinated - partiallyVaccinated;
          
          setChartData([
            { name: 'Fully Vaccinated', count: fullyVaccinated },
            { name: 'Partially Vaccinated', count: partiallyVaccinated },
            { name: 'Not Vaccinated', count: notVaccinated }
          ]);
        }
      } else if (chartType === 'healthIncidents') {
        // Count health incidents by month
        const now = new Date();
        const monthsBack = timeFrame === '12months' ? 12 : 6;
        const months = [];
        
        // Create array of last n months
        for (let i = 0; i < monthsBack; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.unshift({
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            fullDate: date,
            count: 0
          });
        }
        
        // Count records by month
        filteredHealthRecords.forEach(record => {
          if (!record || !record.record_date) return;
          
          try {
            const recordDate = new Date(record.record_date);
            
            // Skip invalid dates
            if (isNaN(recordDate.getTime())) return;
            
            for (const monthData of months) {
              const monthStart = monthData.fullDate;
              const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
              
              if (recordDate >= monthStart && recordDate <= monthEnd) {
                monthData.count += 1;
                break;
              }
            }
          } catch (error) {
            console.error('Error processing record date:', error);
          }
        });
        
        // Format data for chart
        setChartData(months.map(m => ({
          name: `${m.month} ${m.year}`,
          count: m.count
        })));
      }
    };
    
    processData();
  }, [chartType, timeFrame, filteredHealthRecords, filteredVaccinations, filteredMedicationRecords, dogs, puppies, dogId]);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Health Analytics</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="chart-type-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              label="Chart Type"
              onChange={e => setChartType(e.target.value)}
            >
              <MenuItem value="recordTypes">Record Types</MenuItem>
              <MenuItem value="vaccinationStatus">Vaccination Status</MenuItem>
              <MenuItem value="healthIncidents">Health Incidents</MenuItem>
            </Select>
          </FormControl>
          
          {chartType === 'healthIncidents' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-frame-label">Time Frame</InputLabel>
              <Select
                labelId="time-frame-label"
                value={timeFrame}
                label="Time Frame"
                onChange={e => setTimeFrame(e.target.value)}
              >
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="12months">12 Months</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
      
      <Box height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3f51b5" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default HealthAnalytics;
