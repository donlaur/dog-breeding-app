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
import axios from 'axios';

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
      
      axios.get(`/api/application-forms/${id}`)
        .then(response => {
          if (response.data.success) {
            const formData = response.data.data.form;
            const questionsData = response.data.data.questions;
            
            setForm({
              name: formData.name || '',
              description: formData.description || '',
              is_active: formData.is_active || true
            });
            
            setQuestions(questionsData || []);
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
    const newQuestion = {
      tempId: Date.now(), // Temporary ID for new questions
      question_text: 'New Question',
      description: '',
      question_type: 'text',
      is_required: true,
      order_position: questions.length,
      options: null
    };
    
    setQuestions([...questions, newQuestion]);
  };
  
  const updateQuestion = (updatedQuestion) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        (q.id === updatedQuestion.id || q.tempId === updatedQuestion.tempId) 
          ? updatedQuestion 
          : q
      )
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
        response = await axios.put(`/api/application-forms/${formId}`, {
          name: form.name,
          description: form.description,
          is_active: form.is_active
        });
        
        // Handle questions (update, create, delete) if form update was successful
        if (response.data.success) {
          // Get existing questions
          const existingQuestionsRes = await axios.get(`/api/application-forms/${formId}`);
          const existingQuestions = existingQuestionsRes.data.data.questions || [];
          const existingIds = new Set(existingQuestions.map(q => q.id));
          
          // Identify questions to create, update, or delete
          const questionsToCreate = questions.filter(q => !q.id);
          const questionsToUpdate = questions.filter(q => q.id && existingIds.has(q.id));
          const idsToKeep = new Set(questions.filter(q => q.id).map(q => q.id));
          const questionsToDelete = existingQuestions.filter(q => !idsToKeep.has(q.id));
          
          // Create new questions
          for (const question of questionsToCreate) {
            await axios.post('/api/form-questions', {
              ...question,
              form_id: formId
            });
          }
          
          // Update existing questions
          for (const question of questionsToUpdate) {
            await axios.put(`/api/form-questions/${question.id}`, question);
          }
          
          // Delete removed questions
          for (const question of questionsToDelete) {
            await axios.delete(`/api/form-questions/${question.id}`);
          }
          
          // Update question order if needed
          if (questionsToUpdate.length > 0) {
            await axios.post('/api/form-questions/reorder', {
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
        response = await axios.post('/api/application-forms', formData);
        if (response.data.success) {
          setFormId(response.data.data.id);
        }
      }
      
      setSnackbar({
        open: true,
        message: formId ? 'Form updated successfully' : 'Form created successfully',
        severity: 'success'
      });
      
      // If new form was created, update the URL with the form ID
      if (!formId && response.data.success) {
        window.history.replaceState(
          null, 
          '', 
          `${window.location.pathname}?id=${response.data.data.id}`
        );
        setFormId(response.data.data.id);
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
        <Droppable droppableId="questions">
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