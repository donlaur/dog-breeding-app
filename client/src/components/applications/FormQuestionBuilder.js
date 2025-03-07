import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, TextField, IconButton, 
  FormControlLabel, Switch, FormControl, InputLabel,
  Select, MenuItem, Chip, Button, Divider
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Draggable } from 'react-beautiful-dnd';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Single Choice' },
  { value: 'checkbox', label: 'Multiple Choice' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone Number' },
  { value: 'date', label: 'Date' }
];

const FormQuestionBuilder = ({ question, index, updateQuestion, removeQuestion }) => {
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');
  
  // Initialize options from question.options if it exists
  useEffect(() => {
    if (question.options) {
      try {
        const parsedOptions = typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : question.options;
        
        if (Array.isArray(parsedOptions)) {
          setOptions(parsedOptions);
        }
      } catch (e) {
        console.error('Error parsing options:', e);
        setOptions([]);
      }
    } else {
      setOptions([]);
    }
  }, [question.options]);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    let updatedQuestion = {
      ...question,
      [name]: name === 'is_required' ? checked : value
    };
    
    // Reset options when question type changes to non-option type
    if (name === 'question_type') {
      const needsOptions = ['select', 'radio', 'checkbox'].includes(value);
      if (!needsOptions) {
        updatedQuestion.options = null;
      } else if (!question.options) {
        // Initialize options array if switching to an option-based type
        updatedQuestion.options = [];
      }
    }
    
    updateQuestion(updatedQuestion);
  };
  
  const addOption = () => {
    if (!newOption.trim()) return;
    
    const updatedOptions = [...options, newOption.trim()];
    setOptions(updatedOptions);
    updateQuestion({
      ...question,
      options: updatedOptions
    });
    setNewOption('');
  };
  
  const removeOption = (index) => {
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
    updateQuestion({
      ...question,
      options: updatedOptions
    });
  };
  
  // Determine if this question type needs options
  const needsOptions = ['select', 'radio', 'checkbox'].includes(question.question_type);
  
  return (
    <Draggable draggableId={question.id?.toString() || question.tempId?.toString()} index={index}>
      {(provided) => (
        <Paper 
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{ p: 2, mb: 2, position: 'relative' }}
        >
          <Box display="flex" alignItems="center" mb={2}>
            <Box {...provided.dragHandleProps} sx={{ mr: 1, cursor: 'grab' }}>
              <DragIndicatorIcon color="action" />
            </Box>
            
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              Question {index + 1}
            </Typography>
            
            <IconButton 
              color="error" 
              onClick={() => removeQuestion(question.id || question.tempId)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          <TextField
            label="Question Text"
            name="question_text"
            value={question.question_text}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            label="Description/Help Text (Optional)"
            name="description"
            value={question.description || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          
          <Box display="flex" alignItems="center" mt={2} mb={2}>
            <FormControl sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel id={`question-type-label-${question.id || question.tempId}`}>
                Question Type
              </InputLabel>
              <Select
                labelId={`question-type-label-${question.id || question.tempId}`}
                name="question_type"
                value={question.question_type}
                onChange={handleChange}
                label="Question Type"
              >
                {QUESTION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={question.is_required || false}
                  onChange={handleChange}
                  name="is_required"
                />
              }
              label="Required"
            />
          </Box>
          
          {needsOptions && (
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Answer Options
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <TextField
                  label="Add Option"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  size="small"
                  sx={{ mr: 1, flexGrow: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addOption}
                >
                  Add
                </Button>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {options.map((option, idx) => (
                  <Chip
                    key={idx}
                    label={option}
                    onDelete={() => removeOption(idx)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              
              {options.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Add at least one option for this question type.
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Draggable>
  );
};

export default FormQuestionBuilder;