import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, TextField, MenuItem,
  FormControl, FormLabel, RadioGroup, Radio, FormControlLabel,
  FormGroup, Checkbox, Select, InputLabel, Button, Stepper,
  Step, StepLabel, CircularProgress, Alert, Snackbar, Divider
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const ApplicationForm = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const puppyId = queryParams.get('puppyId');
  
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [formResponses, setFormResponses] = useState({});
  const [applicantInfo, setApplicantInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [puppy, setPuppy] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Fetch form data
        const formResponse = await axios.get(`/api/public/forms/${formId}`);
        if (formResponse.data.success) {
          setForm(formResponse.data.data.form);
          
          // Sort questions by order position
          const sortedQuestions = formResponse.data.data.questions.sort(
            (a, b) => a.order_position - b.order_position
          );
          setQuestions(sortedQuestions);
          
          // Initialize form responses
          const initialResponses = {};
          sortedQuestions.forEach(q => {
            initialResponses[q.id] = q.question_type === 'checkbox' ? [] : '';
          });
          setFormResponses(initialResponses);
        }
        
        // If puppyId is provided, fetch puppy data
        if (puppyId) {
          const puppyResponse = await axios.get(`/api/puppies/${puppyId}`);
          if (puppyResponse.data.success) {
            setPuppy(puppyResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load application form',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormData();
  }, [formId, puppyId]);
  
  const handleApplicantInfoChange = (e) => {
    const { name, value } = e.target;
    setApplicantInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleResponseChange = (questionId, value) => {
    setFormResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: null }));
    }
  };
  
  const handleCheckboxChange = (questionId, value) => {
    setFormResponses(prev => {
      const currentValues = prev[questionId] || [];
      const valueIndex = currentValues.indexOf(value);
      
      if (valueIndex === -1) {
        // Add value if not present
        return {
          ...prev,
          [questionId]: [...currentValues, value]
        };
      } else {
        // Remove value if already present
        return {
          ...prev,
          [questionId]: currentValues.filter((_, idx) => idx !== valueIndex)
        };
      }
    });
    
    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: null }));
    }
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      // Validate applicant info
      if (!applicantInfo.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!applicantInfo.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(applicantInfo.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      // Phone is optional, but validate format if provided
      if (applicantInfo.phone && !/^[0-9()-\s]+$/.test(applicantInfo.phone)) {
        newErrors.phone = 'Invalid phone format';
      }
    } else if (step === 1) {
      // Validate form responses for required questions
      questions.forEach(question => {
        if (question.is_required) {
          const response = formResponses[question.id];
          
          if (question.question_type === 'checkbox') {
            if (!response || !response.length) {
              newErrors[question.id] = 'This question requires at least one selection';
            }
          } else if (!response || (typeof response === 'string' && !response.trim())) {
            newErrors[question.id] = 'This question requires an answer';
          }
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    const isValid = validateStep(activeStep);
    
    if (isValid) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async () => {
    // Final validation of all steps
    if (!validateStep(0) || !validateStep(1)) {
      setSnackbar({
        open: true,
        message: 'Please correct the errors before submitting',
        severity: 'error'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format responses for submission
      const formattedResponses = Object.keys(formResponses).map(questionId => ({
        question_id: questionId,
        value: formResponses[questionId]
      }));
      
      const submissionData = {
        applicant_name: applicantInfo.name,
        applicant_email: applicantInfo.email,
        applicant_phone: applicantInfo.phone,
        puppy_id: puppyId,
        responses: formattedResponses
      };
      
      const response = await axios.post(`/api/public/forms/${formId}/submit`, submissionData);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Application submitted successfully!',
          severity: 'success'
        });
        
        // Move to success step
        setActiveStep(2);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Check if we have a specific error message from the server
      let errorMessage = 'Failed to submit application';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Render a question based on its type
  const renderQuestion = (question) => {
    const { id, question_text, description, question_type, is_required, options } = question;
    
    // Parse options if they exist
    let parsedOptions = [];
    if (options) {
      try {
        parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        if (!Array.isArray(parsedOptions)) parsedOptions = [];
      } catch (e) {
        console.error('Error parsing options:', e);
      }
    }
    
    const hasError = Boolean(errors[id]);
    
    switch (question_type) {
      case 'text':
        return (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
          />
        );
        
      case 'textarea':
        return (
          <TextField
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth margin="normal" required={is_required} error={hasError}>
            <InputLabel>Select an option</InputLabel>
            <Select
              value={formResponses[id] || ''}
              label="Select an option"
              onChange={(e) => handleResponseChange(id, e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {parsedOptions.map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {hasError && (
              <Typography variant="caption" color="error">
                {errors[id]}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal" required={is_required} error={hasError}>
            <RadioGroup
              value={formResponses[id] || ''}
              onChange={(e) => handleResponseChange(id, e.target.value)}
            >
              {parsedOptions.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
            {hasError && (
              <Typography variant="caption" color="error">
                {errors[id]}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'checkbox':
        return (
          <FormControl component="fieldset" margin="normal" required={is_required} error={hasError}>
            <FormGroup>
              {parsedOptions.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  control={
                    <Checkbox
                      checked={(formResponses[id] || []).includes(option)}
                      onChange={() => handleCheckboxChange(id, option)}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
            {hasError && (
              <Typography variant="caption" color="error">
                {errors[id]}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'email':
        return (
          <TextField
            fullWidth
            variant="outlined"
            type="email"
            size="small"
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
          />
        );
        
      case 'tel':
        return (
          <TextField
            fullWidth
            variant="outlined"
            type="tel"
            size="small"
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
          />
        );
        
      case 'date':
        return (
          <TextField
            fullWidth
            variant="outlined"
            type="date"
            size="small"
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
            InputLabelProps={{ shrink: true }}
          />
        );
        
      default:
        return (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            margin="normal"
            required={is_required}
            value={formResponses[id] || ''}
            onChange={(e) => handleResponseChange(id, e.target.value)}
            error={hasError}
            helperText={hasError ? errors[id] : null}
          />
        );
    }
  };
  
  // Render content based on current step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Applicant Information
            </Typography>
            
            <TextField
              label="Full Name"
              name="name"
              value={applicantInfo.name}
              onChange={handleApplicantInfoChange}
              fullWidth
              margin="normal"
              required
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={applicantInfo.email}
              onChange={handleApplicantInfoChange}
              fullWidth
              margin="normal"
              required
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
            
            <TextField
              label="Phone Number"
              name="phone"
              value={applicantInfo.phone}
              onChange={handleApplicantInfoChange}
              fullWidth
              margin="normal"
              error={Boolean(errors.phone)}
              helperText={errors.phone}
            />
            
            {puppy && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Applying For
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">
                    {puppy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {puppy.gender}, {puppy.color}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Application Questions
            </Typography>
            {questions.map((question) => (
              <Box key={question.id} sx={{ mb: 3 }}>
                <FormLabel 
                  required={question.is_required}
                  sx={{ 
                    display: 'block', 
                    fontWeight: 'bold', 
                    fontSize: '1rem',
                    mb: 0.5
                  }}
                >
                  {question.question_text}
                </FormLabel>
                
                {question.description && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {question.description}
                  </Typography>
                )}
                
                {renderQuestion(question)}
              </Box>
            ))}
          </Box>
        );
      
      case 2:
        return (
          <Box textAlign="center">
            <Typography variant="h5" gutterBottom>
              Application Submitted Successfully!
            </Typography>
            
            <Typography variant="body1" paragraph>
              Thank you for your application. We will review your information and get back to you shortly.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Return to Home
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!form) {
    return (
      <Container>
        <Box mt={5} textAlign="center">
          <Typography variant="h5" color="error">
            Application form not found or no longer available
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            sx={{ mt: 3 }}
          >
            Return to Home
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mb: 5, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          {form.name}
        </Typography>
        
        {form.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {form.description}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Contact Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Application Questions</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirmation</StepLabel>
          </Step>
        </Stepper>
        
        {renderStepContent()}
        
        {activeStep !== 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Submitting...
                    </>
                  ) : 'Submit Application'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ApplicationForm;