import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { API_URL, debugLog, debugError } from '../../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';

// Contract status options
const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent to Customer' },
  { value: 'signed', label: 'Signed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Fully Paid' },
  { value: 'refunded', label: 'Refunded' }
];

// Payment method options
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' }
];

const CustomerContracts = ({ customerId, customerName, onContractChange }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contract_type: 'purchase',
    contract_date: new Date(),
    status: 'draft',
    description: '',
    amount: '',
    puppy_id: '',
    litter_id: '',
    payment_status: 'unpaid',
    payment_method: '',
    payment_details: '',
    signing_date: null
  });
  
  useEffect(() => {
    loadContracts();
  }, [customerId]);
  
  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`customers/${customerId}/contracts`);
      
      if (response.success) {
        // Sort contracts by date (newest first)
        const sortedContracts = (response.data || []).sort((a, b) => {
          return new Date(b.contract_date) - new Date(a.contract_date);
        });
        setContracts(sortedContracts);
      } else {
        throw new Error(response.error || 'Failed to load contracts');
      }
    } catch (error) {
      debugError('Error loading contracts:', error);
      setError(`Failed to load contracts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle date changes
  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Open the contract dialog for adding or editing
  const handleOpenDialog = (contract = null) => {
    if (contract) {
      // Edit existing contract
      setCurrentContract(contract);
      setFormData({
        contract_type: contract.contract_type || 'purchase',
        contract_date: contract.contract_date ? new Date(contract.contract_date) : new Date(),
        status: contract.status || 'draft',
        description: contract.description || '',
        amount: contract.amount || '',
        puppy_id: contract.puppy_id || '',
        litter_id: contract.litter_id || '',
        payment_status: contract.payment_status || 'unpaid',
        payment_method: contract.payment_method || '',
        payment_details: contract.payment_details || '',
        signing_date: contract.signing_date ? new Date(contract.signing_date) : null
      });
    } else {
      // New contract
      setCurrentContract(null);
      setFormData({
        contract_type: 'purchase',
        contract_date: new Date(),
        status: 'draft',
        description: '',
        amount: '',
        puppy_id: '',
        litter_id: '',
        payment_status: 'unpaid',
        payment_method: '',
        payment_details: '',
        signing_date: null
      });
    }
    
    setDialogOpen(true);
  };
  
  // Close the dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentContract(null);
    setError(null);
  };
  
  // Save a contract (create or update)
  const handleSaveContract = async () => {
    // Validate required fields
    if (!formData.contract_type || !formData.status || !formData.contract_date) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const dataToSend = {
        customer_id: customerId,
        contract_type: formData.contract_type,
        contract_date: formData.contract_date.toISOString(),
        status: formData.status,
        description: formData.description,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        puppy_id: formData.puppy_id || null,
        litter_id: formData.litter_id || null,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method || null,
        payment_details: formData.payment_details || null,
        signing_date: formData.signing_date ? formData.signing_date.toISOString() : null
      };
      
      // Remove any fields that don't exist in the database schema
      if (!dataToSend.puppy_id) delete dataToSend.puppy_id;
      if (!dataToSend.litter_id) delete dataToSend.litter_id;
      if (!dataToSend.payment_method) delete dataToSend.payment_method;
      if (!dataToSend.payment_details) delete dataToSend.payment_details;
      if (!dataToSend.signing_date) delete dataToSend.signing_date;
      
      let response;
      
      if (currentContract) {
        // Update existing contract
        response = await apiPut(`contracts/${currentContract.id}`, dataToSend);
      } else {
        // Create new contract
        response = await apiPost(`customers/${customerId}/contracts`, dataToSend);
      }
      
      if (response.success) {
        handleCloseDialog();
        loadContracts();
        if (onContractChange) onContractChange();
      } else {
        throw new Error(response.error || 'Failed to save contract');
      }
    } catch (error) {
      debugError('Error saving contract:', error);
      setError(`Failed to save contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a contract
  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiDelete(`contracts/${contractId}`);
      
      if (response.success) {
        loadContracts();
        if (onContractChange) onContractChange();
      } else {
        throw new Error(response.error || 'Failed to delete contract');
      }
    } catch (error) {
      debugError('Error deleting contract:', error);
      setError(`Failed to delete contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Open the signing dialog
  const handleOpenSigningDialog = (contract) => {
    setCurrentContract(contract);
    setFormData(prev => ({
      ...prev,
      signing_date: new Date()
    }));
    setSigningDialogOpen(true);
  };
  
  // Close the signing dialog
  const handleCloseSigningDialog = () => {
    setSigningDialogOpen(false);
    setCurrentContract(null);
  };
  
  // Sign a contract
  const handleSignContract = async () => {
    if (!currentContract || !formData.signing_date) {
      setError('Signing date is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dataToSend = {
        status: 'signed',
        signing_date: formData.signing_date.toISOString()
      };
      
      const response = await apiPut(`contracts/${currentContract.id}/sign`, dataToSend);
      
      if (response.success) {
        handleCloseSigningDialog();
        loadContracts();
        if (onContractChange) onContractChange();
      } else {
        throw new Error(response.error || 'Failed to sign contract');
      }
    } catch (error) {
      debugError('Error signing contract:', error);
      setError(`Failed to sign contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Open the payment dialog
  const handleOpenPaymentDialog = (contract) => {
    setCurrentContract(contract);
    setFormData(prev => ({
      ...prev,
      payment_status: contract.payment_status || 'unpaid',
      payment_method: contract.payment_method || '',
      payment_details: contract.payment_details || ''
    }));
    setPaymentDialogOpen(true);
  };
  
  // Close the payment dialog
  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setCurrentContract(null);
  };
  
  // Update payment status
  const handleUpdatePayment = async () => {
    if (!currentContract || !formData.payment_status) {
      setError('Payment status is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dataToSend = {
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        payment_details: formData.payment_details
      };
      
      // Remove any fields that don't exist in the database schema
      if (!dataToSend.payment_method) delete dataToSend.payment_method;
      if (!dataToSend.payment_details) delete dataToSend.payment_details;
      
      const response = await apiPut(`contracts/${currentContract.id}/payment`, dataToSend);
      
      if (response.success) {
        handleClosePaymentDialog();
        loadContracts();
        if (onContractChange) onContractChange();
      } else {
        throw new Error(response.error || 'Failed to update payment status');
      }
    } catch (error) {
      debugError('Error updating payment:', error);
      setError(`Failed to update payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format amount for display
  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Get color for status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'info';
      case 'signed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get color for payment status chip
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'error';
      case 'deposit_paid':
      case 'partially_paid':
        return 'warning';
      case 'paid':
        return 'success';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Contracts</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Contract
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !contracts.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : contracts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No contracts found for this customer.
          </Typography>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 1 }}
          >
            Add First Contract
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>
                    {contract.contract_type === 'purchase' ? 'Purchase' : 
                     contract.contract_type === 'reservation' ? 'Reservation' : 
                     contract.contract_type === 'co_ownership' ? 'Co-Ownership' : 
                     contract.contract_type === 'breeding_rights' ? 'Breeding Rights' : 
                     contract.contract_type}
                  </TableCell>
                  <TableCell>{formatDate(contract.contract_date)}</TableCell>
                  <TableCell>{contract.description || 'N/A'}</TableCell>
                  <TableCell>{formatAmount(contract.amount)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={contract.status} 
                      color={getStatusColor(contract.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={contract.payment_status} 
                      color={getPaymentStatusColor(contract.payment_status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(contract)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {contract.status !== 'signed' && contract.status !== 'cancelled' && (
                        <Tooltip title="Mark as Signed">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleOpenSigningDialog(contract)}
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Update Payment">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleOpenPaymentDialog(contract)}
                        >
                          <AttachMoneyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteContract(contract.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Contract Form Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentContract ? 'Edit Contract' : 'Add Contract'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Contract Type</InputLabel>
                  <Select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleFormChange}
                    label="Contract Type"
                  >
                    <MenuItem value="purchase">Purchase Agreement</MenuItem>
                    <MenuItem value="reservation">Reservation</MenuItem>
                    <MenuItem value="co_ownership">Co-Ownership</MenuItem>
                    <MenuItem value="breeding_rights">Breeding Rights</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Contract Date"
                    value={formData.contract_date}
                    onChange={(newValue) => handleDateChange('contract_date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    label="Status"
                  >
                    {CONTRACT_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  fullWidth
                  type="number"
                  value={formData.amount}
                  onChange={handleFormChange}
                  InputProps={{
                    startAdornment: <span>$</span>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="puppy_id"
                  label="Puppy ID"
                  fullWidth
                  value={formData.puppy_id}
                  onChange={handleFormChange}
                  helperText="Enter puppy ID if this contract is related to a specific puppy"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="litter_id"
                  label="Litter ID"
                  fullWidth
                  value={formData.litter_id}
                  onChange={handleFormChange}
                  helperText="Enter litter ID if this contract is related to a specific litter"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleFormChange}
                    label="Payment Status"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleFormChange}
                    label="Payment Method"
                  >
                    <MenuItem value="">None</MenuItem>
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="payment_details"
                  label="Payment Details"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.payment_details}
                  onChange={handleFormChange}
                  helperText="Enter any additional payment details, such as payment schedule or deposit information"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveContract}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Signing Dialog */}
      <Dialog 
        open={signingDialogOpen} 
        onClose={handleCloseSigningDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mark Contract as Signed</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              You are about to mark this contract as signed. This will update the contract status to "Signed".
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Signing Date"
                value={formData.signing_date}
                onChange={(newValue) => handleDateChange('signing_date', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSigningDialog}>Cancel</Button>
          <Button
            onClick={handleSignContract}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Signing'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Payment Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Update the payment status for this contract.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleFormChange}
                label="Payment Status"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleFormChange}
                label="Payment Method"
              >
                <MenuItem value="">None</MenuItem>
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="payment_details"
              label="Payment Details"
              fullWidth
              multiline
              rows={2}
              value={formData.payment_details}
              onChange={handleFormChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            onClick={handleUpdatePayment}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Define PropTypes for the component
CustomerContracts.propTypes = {
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  customerName: PropTypes.string,
  onContractChange: PropTypes.func
};

export default CustomerContracts;
