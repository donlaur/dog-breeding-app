import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeatContext, HeatProvider } from '../../context/HeatContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';

// Mock the API utility functions according to the established pattern
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

// Helper function to sanitize heat data as expected by the actual code
const sanitizeHeatData = (data) => {
  if (!data) return null;
  
  const sanitized = { ...data };
  // Remove non-schema fields
  delete sanitized.dog_name;
  delete sanitized.dog_info;
  
  return sanitized;
};

// Test component that uses the heat context
const TestComponent = () => {
  const { 
    heats, 
    activeHeat,
    loading,
    error,
    fetchHeats,
    fetchHeat,
    createHeat,
    updateHeat,
    deleteHeat
  } = React.useContext(HeatContext);
  
  return (
    <div>
      <button data-testid="fetch-heats" onClick={() => fetchHeats()}>Fetch Heats</button>
      <button data-testid="fetch-heat" onClick={() => fetchHeat(1)}>Fetch Heat</button>
      <button 
        data-testid="create-heat" 
        onClick={() => createHeat({ 
          dog_id: 1, 
          dog_name: 'Luna', 
          start_date: '2025-03-01',
          end_date: '2025-03-15',
          notes: 'First heat cycle',
          dog_info: { id: 1, name: 'Luna' }
        })}
      >
        Create Heat
      </button>
      <button 
        data-testid="update-heat" 
        onClick={() => updateHeat({ 
          id: 1, 
          dog_id: 1, 
          dog_name: 'Luna',
          start_date: '2025-03-01',
          end_date: '2025-03-15',
          notes: 'Updated heat cycle notes',
          dog_info: { id: 1, name: 'Luna' }
        })}
      >
        Update Heat
      </button>
      <button data-testid="delete-heat" onClick={() => deleteHeat(1)}>Delete Heat</button>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error-state">{error ? error : 'No Error'}</div>
      <div data-testid="heats-count">{heats ? heats.length : 0}</div>
      <pre data-testid="active-heat">{JSON.stringify(activeHeat, null, 2)}</pre>
    </div>
  );
};

describe('HeatContext', () => {
  const mockHeats = [
    { 
      id: 1, 
      dog_id: 1, 
      dog_name: 'Luna', 
      start_date: '2025-03-01',
      end_date: '2025-03-15',
      notes: 'First heat cycle'
    },
    { 
      id: 2, 
      dog_id: 2, 
      dog_name: 'Bella', 
      start_date: '2025-02-15',
      end_date: '2025-03-01',
      notes: 'Second heat cycle'
    }
  ];

  const mockHeat = { 
    id: 1, 
    dog_id: 1, 
    dog_name: 'Luna', 
    start_date: '2025-03-01',
    end_date: '2025-03-15',
    notes: 'First heat cycle',
    dog_info: { id: 1, name: 'Luna', breed_id: 1, breed_name: 'Golden Retriever' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'heats') {
        return Promise.resolve({
          ok: true,
          data: mockHeats
        });
      } else if (endpoint === 'heats/1') {
        return Promise.resolve({
          ok: true,
          data: mockHeat
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    apiPost.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { id: 3, ...mockHeat, notes: 'New Heat' } 
      })
    );
    
    apiPut.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { ...mockHeat, notes: 'Updated Heat' } 
      })
    );
    
    apiDelete.mockImplementation(() => 
      Promise.resolve({ ok: true })
    );
  });
  
  const renderTestComponent = () => {
    return render(
      <HeatProvider>
        <TestComponent />
      </HeatProvider>
    );
  };
  
  test('fetches heats successfully', async () => {
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-heats'));
    
    // Check loading state
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('heats');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Verify heats count
    expect(screen.getByTestId('heats-count')).toHaveTextContent('2');
  });
  
  test('fetches a single heat successfully', async () => {
    renderTestComponent();
    
    // Click the fetch heat button
    fireEvent.click(screen.getByTestId('fetch-heat'));
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('heats/1');
      expect(screen.getByTestId('active-heat')).toHaveTextContent('Luna');
    });
  });
  
  test('creates a heat with sanitized data', async () => {
    renderTestComponent();
    
    // Click the create button
    fireEvent.click(screen.getByTestId('create-heat'));
    
    // Wait for create to complete
    await waitFor(() => {
      // Verify apiPost was called with sanitized data
      expect(apiPost).toHaveBeenCalled();
      
      // Get the data passed to apiPost
      const postData = apiPost.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(postData.dog_name).toBeUndefined();
      expect(postData.dog_info).toBeUndefined();
      
      // Check that schema fields were included
      expect(postData.dog_id).toBe(1);
      expect(postData.start_date).toBe('2025-03-01');
      expect(postData.end_date).toBe('2025-03-15');
      expect(postData.notes).toBe('First heat cycle');
    });
  });
  
  test('updates a heat with sanitized data', async () => {
    renderTestComponent();
    
    // Click the update button
    fireEvent.click(screen.getByTestId('update-heat'));
    
    // Wait for update to complete
    await waitFor(() => {
      // Verify apiPut was called with sanitized data
      expect(apiPut).toHaveBeenCalled();
      
      // Get the data passed to apiPut
      const putData = apiPut.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(putData.dog_name).toBeUndefined();
      expect(putData.dog_info).toBeUndefined();
      
      // Check that schema fields were included
      expect(putData.id).toBe(1);
      expect(putData.dog_id).toBe(1);
      expect(putData.start_date).toBe('2025-03-01');
      expect(putData.end_date).toBe('2025-03-15');
      expect(putData.notes).toBe('Updated heat cycle notes');
    });
  });
  
  test('deletes a heat successfully', async () => {
    renderTestComponent();
    
    // Click the delete button
    fireEvent.click(screen.getByTestId('delete-heat'));
    
    // Wait for delete to complete
    await waitFor(() => {
      // Verify apiDelete was called with correct endpoint
      expect(apiDelete).toHaveBeenCalledWith('heats/1');
    });
  });
  
  test('handles API errors gracefully', async () => {
    // Mock an API error
    apiGet.mockImplementation(() => 
      Promise.resolve({ 
        ok: false, 
        error: 'Failed to fetch heats' 
      })
    );
    
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-heats'));
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to fetch heats');
    });
  });
});
