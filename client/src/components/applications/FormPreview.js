import React from 'react';
import {
  Box, Typography, TextField, FormControl, FormLabel,
  RadioGroup, Radio, FormControlLabel, FormGroup,
  Checkbox, Select, MenuItem, InputLabel, Divider
} from '@mui/material';

const FormPreview = ({ formName, formDescription, questions }) => {
  // Sort questions by order position
  const sortedQuestions = [...questions].sort((a, b) => a.order_position - b.order_position);
  
  const renderQuestionInput = (question) => {
    const { id, question_text, description, question_type, is_required, options } = question;
    const labelId = `question-${id || Math.random().toString(36).substring(2, 11)}`;
    
    let parsedOptions = [];
    if (options) {
      try {
        parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        if (!Array.isArray(parsedOptions)) parsedOptions = [];
      } catch (e) {
        console.error('Error parsing options:', e);
      }
    }
    
    switch (question_type) {
      case 'text':
        return (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            margin="normal"
            required={is_required}
            disabled
            placeholder="Short text answer"
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
            disabled
            placeholder="Long text answer"
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth margin="normal" required={is_required}>
            <InputLabel id={labelId}>Select an option</InputLabel>
            <Select
              labelId={labelId}
              label="Select an option"
              disabled
            >
              {parsedOptions.map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal" required={is_required}>
            <RadioGroup aria-labelledby={labelId}>
              {parsedOptions.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio disabled />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        
      case 'checkbox':
        return (
          <FormControl component="fieldset" margin="normal" required={is_required}>
            <FormGroup>
              {parsedOptions.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  control={<Checkbox disabled />}
                  label={option}
                />
              ))}
            </FormGroup>
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
            disabled
            placeholder="Email address"
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
            disabled
            placeholder="Phone number"
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
            disabled
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
            disabled
            placeholder="Text answer"
          />
        );
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {formName || 'Application Form Preview'}
      </Typography>
      
      {formDescription && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {formDescription}
        </Typography>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ py: 2 }}>
        {sortedQuestions.map((question) => (
          <Box key={question.id || question.tempId} sx={{ mb: 3 }}>
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
            
            {renderQuestionInput(question)}
          </Box>
        ))}
        
        {sortedQuestions.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center">
            No questions added yet. Add questions to preview the form.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default FormPreview;