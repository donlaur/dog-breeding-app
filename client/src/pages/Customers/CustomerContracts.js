import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';
import { debugLog, debugError } from '../../config';
import { showSuccess, showError } from '../../utils/notifications';

// Contract status options with colors and icons
const CONTRACT_STATUS = [
  { value: 'draft', label: 'Draft', color: '#9E9E9E', icon: <EditIcon /> },
  { value: 'sent', label: 'Sent', color: '#2196F3', icon: <EmailIcon /> },
  { value: 'viewed', label: 'Viewed', color: '#FF9800', icon: <VisibilityIcon /> },
  { value: 'signed', label: 'Signed', color: '#4CAF50', icon: <CheckCircleIcon /> },
  { value: 'expired', label: 'Expired', color: '#F44336', icon: <CancelIcon /> },
  { value: 'pending', label: 'Pending Payment', color: '#9C27B0', icon: <PendingIcon /> }
];

// Contract types
const CONTRACT_TYPES = [
  { value: 'puppy_sale', label: 'Puppy Sale Agreement' },
  { value: 'stud_service', label: 'Stud Service Agreement' },
  { value: 'co_ownership', label: 'Co-Ownership Agreement' },
  { value: 'health_guarantee', label: 'Health Guarantee' },
  { value: 'spay_neuter', label: 'Spay/Neuter Agreement' },
  { value: 'deposit', label: 'Deposit Agreement' },
  { value: 'custom', label: 'Custom Contract' }
];

const CustomerContracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    customer_id: '',
    contract_type: '',
    template_id: '',
    title: '',
    amount: '',
    due_date: '',
    notes: ''
  });
  
  useEffect(() => {
    loadData();
  }, [currentTab]);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load customers
      const customersResponse = await apiGet('customers');
      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      }
      
      // Load contract templates
      const templatesResponse = await apiGet('contract-templates');
      if (templatesResponse.success) {
        setTemplates(templatesResponse.data || []);
      }
      
      // Load contracts
      let contractsResponse;
      if (currentTab === 'all') {
        contractsResponse = await apiGet('contracts');
      } else {
        contractsResponse = await apiGet(`contracts?status=${currentTab}`);
      }
      
      if (contractsResponse.success) {
        setContracts(contractsResponse.data || []);
      } else {
        throw new Error(contractsResponse.error || 'Failed to load contracts');
      }
    } catch (error) {
      debugError('Error loading contracts data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateContract = async () => {
    try {
      const response = await apiPost('contracts', newContract);
      
      if (response.success) {
        showSuccess('Contract created successfully');
        loadData();
        setDialogOpen(false);
        // Reset form
        setNewContract({
          customer_id: '',
          contract_type: '',
          template_id: '',
          title: '',
          amount: '',
          due_date: '',
          notes: ''
        });
      } else {
        throw new Error(response.error || 'Failed to create contract');
      }
    } catch (error) {
      debugError('Error creating contract:', error);
      showError(error.message);
    }
  };
  
  const handleSendContract = async (id) => {
    try {
      const response = await apiPost(`contracts/${id}/send`, {});
      
      if (response.success) {
        showSuccess('Contract sent successfully');
        loadData();
      } else {
        throw new Error(response.error || 'Failed to send contract');
      }
    } catch (error) {
      debugError('Error sending contract:', error);
      showError(error.message);
    }
  };
  
  const handleDeleteContract = async (id) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        const response = await apiDelete(`contracts/${id}`);
        
        if (response.success) {
          showSuccess('Contract deleted successfully');
          loadData();
        } else {
          throw new Error(response.error || 'Failed to delete contract');
        }
      } catch (error) {
        debugError('Error deleting contract:', error);
        showError(error.message);
      }
    }
  };
  
  const filteredContracts = contracts.filter(contract => {
    const searchTermLower = searchTerm.toLowerCase();
    const customerName = customers.find(c => c.id === contract.customer_id)?.name || '';
    
    return (
      customerName.toLowerCase().includes(searchTermLower) ||
      contract.title?.toLowerCase().includes(searchTermLower) ||
      contract.contract_type?.toLowerCase().includes(searchTermLower)
    );
  });
  
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };
  
  const getContractTypeLabel = (type) => {
    const contractType = CONTRACT_TYPES.find(t => t.value === type);
    return contractType ? contractType.label : type;
  };
  
  const getStatusChip = (status) => {
    const statusOption = CONTRACT_STATUS.find(option => option.value === status) || CONTRACT_STATUS[0];
    return (
      <Chip 
        icon={statusOption.icon}
        label={statusOption.label} 
        style={{ 
          backgroundColor: statusOption.color,
          color: 'white'
        }}
        size="small"
      />
    );
  };
  
  const getContractProgress = (contract) => {
    const statusMap = {
      'draft': 0,
      'sent': 1,
      'viewed': 2,
      'signed': 3,
      'pending': 4,
      'completed': 5,
      'expired': -1
    };
    
    const currentStep = statusMap[contract.status] || 0;
    const totalSteps = 5; // draft -> sent -> viewed -> signed -> pending -> completed
    
    if (currentStep === -1) {
      return (
        <LinearProgress 
          variant="determinate" 
          value={100} 
          sx={{ height: 8, borderRadius: 4, bgcolor: '#ffcdd2' }}
          color="error"
        />
      );
    }
    
    return (
      <LinearProgress 
        variant="determinate" 
        value={(currentStep / totalSteps) * 100} 
        sx={{ height: 8, borderRadius: 4 }}
      />
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Contracts
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Create Contract
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Contracts" value="all" />
          {CONTRACT_STATUS.map(status => (
            <Tab 
              key={status.value} 
              label={status.label} 
              value={status.value}
              icon={status.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredContracts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No contracts found. {searchTerm ? 'Try a different search term.' : 'Create your first contract to get started.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{getCustomerName(contract.customer_id)}</TableCell>
                  <TableCell>{getContractTypeLabel(contract.contract_type)}</TableCell>
                  <TableCell>{getStatusChip(contract.status)}</TableCell>
                  <TableCell>{new Date(contract.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {contract.amount ? `$${parseFloat(contract.amount).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell sx={{ width: '15%' }}>
                    {getContractProgress(contract)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Contract">
                        <IconButton onClick={() => navigate(`/contracts/${contract.id}`)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {contract.status === 'draft' && (
                        <Tooltip title="Send Contract">
                          <IconButton 
                            color="primary"
                            onClick={() => handleSendContract(contract.id)}
                          >
                            <EmailIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Download PDF">
                        <IconButton>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {contract.status === 'draft' && (
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteContract(contract.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Create Contract Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Contract</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a new contract for a customer. You can use an existing template or create a custom contract.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={newContract.customer_id}
                  onChange={handleInputChange}
                  label="Customer"
                  required
                >
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Contract Type</InputLabel>
                <Select
                  name="contract_type"
                  value={newContract.contract_type}
                  onChange={handleInputChange}
                  label="Contract Type"
                  required
                >
                  {CONTRACT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  name="template_id"
                  value={newContract.template_id}
                  onChange={handleInputChange}
                  label="Template"
                  disabled={!newContract.contract_type}
                >
                  <MenuItem value="">
                    <em>No Template (Custom)</em>
                  </MenuItem>
                  {templates
                    .filter(t => t.contract_type === newContract.contract_type)
                    .map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contract Title"
                name="title"
                value={newContract.title}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={newContract.amount}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="due_date"
                type="date"
                value={newContract.due_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={newContract.notes}
                onChange={handleInputChange}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreateContract} 
            color="primary"
            disabled={!newContract.customer_id || !newContract.contract_type || !newContract.title}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerContracts;
