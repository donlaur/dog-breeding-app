import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Paper, 
  Switch, FormControlLabel, Divider, CircularProgress,
  IconButton, Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import FormQuestionBuilder from '../../components/applications/FormQuestionBuilder';
import FormPreview from '../../components/applications/FormPreview';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { apiPost, apiPut, apiGet, apiDelete } from '../../utils/apiUtils';

const FormBuilder = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formId, setFormId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load form if editing an existing one
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id) {
      setFormId(parseInt(id));
      setLoading(true);
      
      apiGet(`application-forms/${id}`)
        .then(response => {
          if (response.ok && response.data) {
            const formData = response.data.form;
            const questionsData = response.data.questions;
            
            setForm({
              name: formData.name || '',
              description: formData.description || '',
              is_active: formData.is_active || true
            });
            
            setQuestions(questionsData || []);
          } else {
            setSnackbar({
              open: true,
              message: 'Failed to load form',
              severity: 'error'
            });
          }
        })
        .catch(error => {
          console.error('Error loading form:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load form',
            severity: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);
  
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: name === 'is_active' ? checked : value
    }));
  };
  
  const addQuestion = () => {
    // Generate a unique ID with more entropy to avoid collisions
    const uniqueId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newQuestion = {
      tempId: uniqueId, // Enhanced temporary ID for questions
      question_text: 'New Question',
      description: '',
      question_type: 'text',
      is_required: true,
      order_position: questions.length,
      options: null
    };
    
    // Add question to state using functional update to ensure latest state
    setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
  };
  
  const updateQuestion = (updatedQuestion) => {
    // For diagnostic purposes, log what's being updated
    console.log("Updating question:", updatedQuestion.tempId || updatedQuestion.id);
    
    setQuestions(prevQuestions => 
      prevQuestions.map(q => {
        // Compare IDs to find the specific question to update
        const isMatch = (q.id && updatedQuestion.id && q.id === updatedQuestion.id) || 
                        (q.tempId && updatedQuestion.tempId && q.tempId === updatedQuestion.tempId);
        
        // Only update the matching question, preserve all others exactly as they are
        return isMatch ? {...updatedQuestion} : q;
      })
    );
  };
  
  const removeQuestion = (questionId) => {
    setQuestions(prevQuestions => 
      prevQuestions.filter(q => q.id !== questionId && q.tempId !== questionId)
    );
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_position: index
    }));
    
    setQuestions(updatedItems);
  };
  
  const saveForm = async () => {
    setLoading(true);
    
    try {
      // Validate form data
      if (!form.name) {
        setSnackbar({
          open: true,
          message: 'Form name is required',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Validate questions
      if (questions.length === 0) {
        setSnackbar({
          open: true,
          message: 'At least one question is required',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Prepare form data - ensure all IDs are treated as integers
      const formData = {
        ...form,
        questions: questions.map((q, idx) => {
          // Process options - ensure they are properly formatted for the API
          let processedOptions = q.options;
          if (processedOptions && Array.isArray(processedOptions)) {
            processedOptions = JSON.stringify(processedOptions);
          }
          
          const questionData = {
            ...q,
            order_position: idx,
            options: processedOptions
          };
          
          // Convert ID to integer if it exists
          if (q.id) {
            questionData.id = parseInt(q.id);
          }
          
          // Remove tempId if present to avoid sending it to server
          if (questionData.tempId) {
            delete questionData.tempId;
          }
          
          return questionData;
        })
      };
      
      console.log('Saving form data:', formData);
      
      let response;
      
      // Update existing form or create new one
      if (formId) {
        // Update existing form
        const questionsToCreate = questions.filter(q => !q.id);
        const questionsToUpdate = questions.filter(q => q.id && q.modified);
        const existingQuestionIds = questions.filter(q => q.id).map(q => parseInt(q.id));
        
        // Get current questions to find deleted ones
        const currentQuestionsResponse = await apiGet(`application-forms/${formId}`);
        let questionsToDelete = [];
        
        if (currentQuestionsResponse.ok && currentQuestionsResponse.data && 
            currentQuestionsResponse.data.questions) {
          const currentQuestions = currentQuestionsResponse.data.questions;
          questionsToDelete = currentQuestions.filter(q => 
            !existingQuestionIds.includes(parseInt(q.id))
          );
        }
        
        // Update the form first
        response = await apiPut(`application-forms/${formId}`, {
          name: form.name,
          description: form.description,
          is_active: form.is_active
        });
        
        if (response.ok) {
          // Create new questions
          for (const question of questionsToCreate) {
            // Process options - ensure they are properly formatted for the API
            let processedOptions = question.options;
            if (processedOptions && Array.isArray(processedOptions)) {
              processedOptions = JSON.stringify(processedOptions);
            }
            
            const questionData = {
              form_id: formId,
              question_text: question.question_text,
              description: question.description || '',
              question_type: question.question_type,
              is_required: question.is_required,
              options: processedOptions,
              order_position: questions.indexOf(question)
            };
            
            const createResponse = await apiPost('form-questions', questionData);
            console.log('Question creation response:', createResponse);
          }
          
          // Update existing questions
          for (const question of questionsToUpdate) {
            // Process options - ensure they are properly formatted for the API
            let processedOptions = question.options;
            if (processedOptions && Array.isArray(processedOptions)) {
              processedOptions = JSON.stringify(processedOptions);
            }
            
            // Ensure ID is an integer
            const questionData = {
              ...question,
              id: parseInt(question.id),
              options: processedOptions
            };
            
            // Remove tempId if present to avoid sending it to server
            if (questionData.tempId) {
              delete questionData.tempId;
            }
            
            // Remove the modified flag before sending to API
            if (questionData.modified) {
              delete questionData.modified;
            }
            
            const updateResponse = await apiPut(`form-questions/${question.id}`, questionData);
            console.log('Question update response:', updateResponse);
          }
          
          // Delete removed questions
          for (const question of questionsToDelete) {
            await apiDelete(`form-questions/${question.id}`);
          }
          
          // Update question order if needed
          if (questions.filter(q => q.id).length > 0) {
            const reorderResponse = await apiPost('form-questions/reorder', {
              form_id: formId,
              questions: questions.filter(q => q.id).map((q, idx) => ({
                id: parseInt(q.id),
                order_position: idx
              }))
            });
            console.log('Question reorder response:', reorderResponse);
          }
        }
      } else {
        // Process options for all questions before sending to API
        const processedFormData = {
          ...formData,
          questions: formData.questions.map(q => {
            let processedOptions = q.options;
            if (processedOptions && Array.isArray(processedOptions)) {
              return { ...q, options: JSON.stringify(processedOptions) };
            }
            return q;
          })
        };
        
        // Create new form with questions
        response = await apiPost('application-forms', processedFormData);
        console.log('Form creation response:', response);
      }
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to save form');
      }
      
      setSnackbar({
        open: true,
        message: formId ? 'Form updated successfully' : 'Form created successfully',
        severity: 'success'
      });
      
      // If new form was created, update the URL with the form ID
      if (!formId && response.ok && response.data) {
        // Get the form ID from the response, accounting for different API response formats
        let newFormId = null;
        if (response.data.id) {
          newFormId = response.data.id;
        } else if (response.data.data && response.data.data.id) {
          newFormId = response.data.data.id;
        }
        
        if (newFormId) {
          // For development mode with mock IDs (9999), redirect to forms list
          if (newFormId === 9999) {
            console.log("Development mode detected with mock ID, redirecting to forms list");
            setTimeout(() => {
              window.location.href = "/dashboard/applications/forms";
            }, 1500);
          } else {
            // Regular behavior for real form IDs - update URL and redirect to form builder
            // Update URL without reloading the page
            window.history.replaceState(
              null, 
              '', 
              `${window.location.pathname}?id=${newFormId}`
            );
            
            // Set the form ID in state
            setFormId(parseInt(newFormId));
            
            // Refresh the page to load the newly created form
            setTimeout(() => {
              window.location.href = `/dashboard/applications/builder?id=${newFormId}`;
            }, 1000);
          }
        }
      }
      
    } catch (error) {
      console.error('Error saving form:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to save form'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  if (loading && !questions.length) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {formId ? 'Edit Application Form' : 'Create Application Form'}
        </Typography>
        
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="Form Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={handleFormChange}
                name="is_active"
              />
            }
            label="Active (visible to applicants)"
          />
        </Box>
      </Paper>
      
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Questions</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PreviewIcon />}
            onClick={() => setShowPreview(!showPreview)}
            sx={{ mr: 1 }}
          >
            {showPreview ? 'Hide Preview' : 'Preview Form'}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={saveForm}
            disabled={loading}
          >
            Save Form
          </Button>
        </Box>
      </Box>
      
      {showPreview ? (
        <Box mb={3}>
          <Paper sx={{ p: 3 }}>
            <FormPreview
              formName={form.name}
              formDescription={form.description}
              questions={questions}
            />
          </Paper>
        </Box>
      ) : null}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable 
          droppableId="questions" 
          type="QUESTION"
          ignoreContainerClipping={false}
          isDropDisabled={false}
          isCombineEnabled={false}
          direction="vertical"
        >
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ minHeight: '100px' }}
            >
              {questions.map((question, index) => (
                <FormQuestionBuilder
                  key={question.id || question.tempId}
                  question={question}
                  index={index}
                  updateQuestion={updateQuestion}
                  removeQuestion={removeQuestion}
                />
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      
      <Box mt={2} mb={5} display="flex" justifyContent="center">
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addQuestion}
        >
          Add Question
        </Button>
      </Box>
      
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

export default FormBuilder;