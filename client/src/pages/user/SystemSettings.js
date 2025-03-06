import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Alert,
  Snackbar,
  ButtonGroup,
  IconButton,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

function SystemSettings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    autoSave: true,
    dataRetention: 30,
    cacheSize: 500,
    sessionTimeout: 60,
    developerMode: false,
    analyticsEnabled: true,
    backupFrequency: 'weekly',
    dateFormat: 'MM/DD/YYYY',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const handleSettingChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings({
      ...settings,
      [name]: event.target.type === 'checkbox' ? checked : value
    });
  };
  
  const handleSaveSettings = () => {
    // In a real app, save settings to backend
    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success'
    });
  };
  
  const handleResetSettings = () => {
    // In a real app, reset settings to defaults
    setSettings({
      theme: 'light',
      language: 'en',
      autoSave: true,
      dataRetention: 30,
      cacheSize: 500,
      sessionTimeout: 60,
      developerMode: false,
      analyticsEnabled: true,
      backupFrequency: 'weekly',
      dateFormat: 'MM/DD/YYYY',
    });
    
    setSnackbar({
      open: true,
      message: 'Settings reset to defaults',
      severity: 'info'
    });
  };
  
  const handleClearCache = () => {
    // In a real app, clear the cache
    setSnackbar({
      open: true,
      message: 'Cache cleared successfully',
      severity: 'success'
    });
  };
  
  const handleBackupData = () => {
    // In a real app, trigger a data backup
    setSnackbar({
      open: true,
      message: 'Data backup initiated',
      severity: 'info'
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ mr: 1 }} /> System Settings
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleResetSettings}
          sx={{ mr: 2 }}
        >
          Reset to Defaults
        </Button>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={handleSaveSettings}
        >
          Save Changes
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Appearance" 
              avatar={settings.theme === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Theme</InputLabel>
                <Select
                  name="theme"
                  value={settings.theme}
                  label="Theme"
                  onChange={handleSettingChange}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  name="language"
                  value={settings.language}
                  label="Language"
                  onChange={handleSettingChange}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Data & Storage" 
              avatar={<StorageIcon />}
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Date Format</InputLabel>
                <Select
                  name="dateFormat"
                  value={settings.dateFormat}
                  label="Date Format"
                  onChange={handleSettingChange}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Data Retention (days)"
                  name="dataRetention"
                  type="number"
                  value={settings.dataRetention}
                  onChange={handleSettingChange}
                  InputProps={{ inputProps: { min: 1, max: 365 } }}
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Cache Size (MB)"
                  name="cacheSize"
                  type="number"
                  value={settings.cacheSize}
                  onChange={handleSettingChange}
                  InputProps={{ inputProps: { min: 100, max: 1000 } }}
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  name="backupFrequency"
                  value={settings.backupFrequency}
                  label="Backup Frequency"
                  onChange={handleSettingChange}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="never">Never</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<DeleteOutlineIcon />} 
                  onClick={handleClearCache}
                >
                  Clear Cache
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<CloudDownloadIcon />} 
                  onClick={handleBackupData}
                >
                  Backup Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Security & Privacy" 
              avatar={<SecurityIcon />}
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={handleSettingChange}
                  InputProps={{ inputProps: { min: 5, max: 120 } }}
                />
              </FormControl>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analyticsEnabled}
                      onChange={handleSettingChange}
                      name="analyticsEnabled"
                    />
                  }
                  label="Enable Usage Analytics"
                />
                <Tooltip title="Collects anonymous usage data to improve the application">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Advanced Settings" 
              avatar={<SettingsIcon />}
            />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoSave}
                      onChange={handleSettingChange}
                      name="autoSave"
                    />
                  }
                  label="Auto-save Changes"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.developerMode}
                      onChange={handleSettingChange}
                      name="developerMode"
                    />
                  }
                  label="Developer Mode"
                />
                <Tooltip title="Enables advanced debugging features">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SystemSettings;