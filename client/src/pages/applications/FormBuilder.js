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
      setFormId(id);
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
    if (!form.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Form name is required',
        severity: 'error'
      });
      return;
    }
    
    if (questions.length === 0) {
      setSnackbar({
        open: true,
        message: 'Add at least one question to your form',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      const formData = {
        ...form,
        questions: questions
      };
      
      if (formId) {
        // Update existing form
        response = await apiPut(`application-forms/${formId}`, {
          name: form.name,
          description: form.description,
          is_active: form.is_active
        });
        
        // Handle questions (update, create, delete) if form update was successful
        if (response.ok) {
          // Get existing questions
          const existingQuestionsRes = await apiGet(`application-forms/${formId}`);
          const existingQuestions = existingQuestionsRes.data?.questions || [];
          const existingIds = new Set(existingQuestions.map(q => q.id));
          
          // Identify questions to create, update, or delete
          const questionsToCreate = questions.filter(q => !q.id);
          const questionsToUpdate = questions.filter(q => q.id && existingIds.has(q.id));
          const idsToKeep = new Set(questions.filter(q => q.id).map(q => q.id));
          const questionsToDelete = existingQuestions.filter(q => !idsToKeep.has(q.id));
          
          console.log('Creating questions:', questionsToCreate.length);
          console.log('Updating questions:', questionsToUpdate.length);
          console.log('Deleting questions:', questionsToDelete.length);
          
          // Create new questions
          for (const question of questionsToCreate) {
            // Create a clean copy of the question without tempId
            const { tempId, ...cleanQuestion } = question;
            await apiPost('form-questions', {
              ...cleanQuestion,
              form_id: formId
            });
          }
          
          // Update existing questions
          for (const question of questionsToUpdate) {
            await apiPut(`form-questions/${question.id}`, question);
          }
          
          // Delete removed questions
          for (const question of questionsToDelete) {
            await apiDelete(`form-questions/${question.id}`);
          }
          
          // Update question order if needed
          if (questionsToUpdate.length > 0) {
            await apiPost('form-questions/reorder', {
              form_id: formId,
              questions: questions.filter(q => q.id).map((q, idx) => ({
                id: q.id,
                order_position: idx
              }))
            });
          }
        }
      } else {
        // Create new form with questions
        response = await apiPost('application-forms', formData);
        console.log('Form creation response:', response);
        if (response.ok && response.data) {
          if (response.data.id) {
            setFormId(response.data.id);
          } else if (response.data.data && response.data.data.id) {
            // Handle different API response formats
            setFormId(response.data.data.id);
          }
        }
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
          console.log(`Form created with ID: ${newFormId}`);
          window.history.replaceState(
            null, 
            '', 
            `${window.location.pathname}?id=${newFormId}`
          );
          setFormId(newFormId);
        }
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save form',
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
          isDropDisabled={false}
          isCombineEnabled={false}
        >
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
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