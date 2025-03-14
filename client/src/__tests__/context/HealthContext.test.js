import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthContext, HealthProvider } from '../../context/HealthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';

// Mock the API utility functions
jest.mock('../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
}));

// Mock the notifications utility
jest.mock('../../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
}));

// Mock the config imports
jest.mock('../../config', () => ({
  API_URL: '/api',
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

// Test component that uses the health context
const TestComponent = () => {
  const { 
    dashboardData, 
    fetchDashboardData, 
    createHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    isLoading, 
    error 
  } = React.useContext(HealthContext);
  
  return (
    <div>
      <button data-testid="fetch-dashboard" onClick={fetchDashboardData}>Fetch Dashboard</button>
      <button 
        data-testid="create-record" 
        onClick={() => createHealthRecord({
          record_type: 'Vaccination',
          record_date: '2025-03-14',
          dog_id: 1,
          dog_name: 'Max', // Non-schema field
          owner_name: 'John Doe', // Non-schema field
          notes: 'Rabies vaccination'
        })}
      >
        Create Health Record
      </button>
      <button 
        data-testid="update-record" 
        onClick={() => updateHealthRecord({
          id: 1,
          record_type: 'Vaccination',
          record_date: '2025-03-14',
          dog_id: 1,
          dog_name: 'Max', // Non-schema field
          owner_name: 'John Doe', // Non-schema field
          notes: 'Updated vaccination notes'
        })}
      >
        Update Health Record
      </button>
      <button data-testid="delete-record" onClick={() => deleteHealthRecord(1)}>Delete Health Record</button>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error-state">{error ? error : 'No Error'}</div>
      <pre data-testid="dashboard-data">{JSON.stringify(dashboardData, null, 2)}</pre>
    </div>
  );
};

describe('HealthContext', () => {
  const mockDashboardData = {
    upcoming_vaccinations: { count: 2, items: [{id: 1}, {id: 2}] },
    active_medications: { count: 1, items: [{id: 3}] },
    active_conditions: { count: 0, items: [] },
    recent_records: { count: 3, items: [{id: 4}, {id: 5}, {id: 6}] }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'health/dashboard') {
        return Promise.resolve({
          ok: true,
          data: mockDashboardData
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    apiPost.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { id: 1, record_type: 'Vaccination', record_date: '2025-03-14' } 
      })
    );
    
    apiPut.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { id: 1, record_type: 'Vaccination', record_date: '2025-03-14', notes: 'Updated vaccination notes' } 
      })
    );
    
    apiDelete.mockImplementation(() => 
      Promise.resolve({ ok: true })
    );
  });
  
  const renderTestComponent = () => {
    return render(
      <HealthProvider>
        <TestComponent />
      </HealthProvider>
    );
  };
  
  test('fetches dashboard data successfully', async () => {
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-dashboard'));
    
    // Check loading state
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('health/dashboard');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Verify dashboard data content
    expect(screen.getByTestId('dashboard-data')).toHaveTextContent('upcoming_vaccinations');
    expect(screen.getByTestId('dashboard-data')).toHaveTextContent('"count":2');
  });
  
  test('creates a health record with sanitized data', async () => {
    renderTestComponent();
    
    // Click the create button
    fireEvent.click(screen.getByTestId('create-record'));
    
    // Wait for create to complete
    await waitFor(() => {
      // Verify apiPost was called with sanitized data
      expect(apiPost).toHaveBeenCalled();
      
      // Get the data passed to apiPost
      const postData = apiPost.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(postData.dog_name).toBeUndefined();
      expect(postData.owner_name).toBeUndefined();
      
      // Check that schema fields were included
      expect(postData.record_type).toBe('Vaccination');
      expect(postData.record_date).toBe('2025-03-14');
      expect(postData.dog_id).toBe(1);
      expect(postData.notes).toBe('Rabies vaccination');
    });
  });
  
  test('updates a health record with sanitized data', async () => {
    renderTestComponent();
    
    // Click the update button
    fireEvent.click(screen.getByTestId('update-record'));
    
    // Wait for update to complete
    await waitFor(() => {
      // Verify apiPut was called with sanitized data
      expect(apiPut).toHaveBeenCalled();
      
      // Get the data passed to apiPut
      const putData = apiPut.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(putData.dog_name).toBeUndefined();
      expect(putData.owner_name).toBeUndefined();
      
      // Check that schema fields were included
      expect(putData.id).toBe(1);
      expect(putData.record_type).toBe('Vaccination');
      expect(putData.record_date).toBe('2025-03-14');
      expect(putData.dog_id).toBe(1);
      expect(putData.notes).toBe('Updated vaccination notes');
    });
  });
  
  test('deletes a health record successfully', async () => {
    renderTestComponent();
    
    // Click the delete button
    fireEvent.click(screen.getByTestId('delete-record'));
    
    // Wait for delete to complete
    await waitFor(() => {
      // Verify apiDelete was called with correct endpoint
      expect(apiDelete).toHaveBeenCalledWith('health/records/1');
    });
  });
  
  test('handles API errors gracefully', async () => {
    // Mock an API error
    apiGet.mockImplementation(() => 
      Promise.resolve({ 
        ok: false, 
        error: 'Failed to fetch dashboard data' 
      })
    );
    
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-dashboard'));
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to fetch dashboard data');
    });
    
    // Verify fallback data is provided
    const dashboardData = JSON.parse(screen.getByTestId('dashboard-data').textContent);
    expect(dashboardData.upcoming_vaccinations.count).toBe(0);
    expect(dashboardData.active_medications.count).toBe(0);
    expect(dashboardData.active_conditions.count).toBe(0);
    expect(dashboardData.recent_records.count).toBe(0);
  });
});
