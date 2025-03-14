import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LitterContext, LitterProvider } from '../../context/LitterContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';
import { DogProvider } from '../../context/DogContext';

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

// Helper function to sanitize litter data as expected by the actual code
const sanitizeLitterData = (data) => {
  if (!data) return null;
  
  const sanitized = { ...data };
  // Remove non-schema fields as specified in the memory
  delete sanitized.dam_name;
  delete sanitized.sire_name;
  delete sanitized.breed_name;
  delete sanitized.dam_info;
  delete sanitized.sire_info;
  delete sanitized.breed_info;
  
  return sanitized;
};

// Test component that uses the litter context
const TestComponent = () => {
  const { 
    litters, 
    activeLitter,
    loading,
    error,
    fetchLitters,
    fetchLitter,
    createLitter,
    updateLitter,
    deleteLitter,
    setLitterStatus
  } = React.useContext(LitterContext);
  
  return (
    <div>
      <button data-testid="fetch-litters" onClick={() => fetchLitters()}>Fetch Litters</button>
      <button data-testid="fetch-litter" onClick={() => fetchLitter(1)}>Fetch Litter</button>
      <button 
        data-testid="create-litter" 
        onClick={() => createLitter({ 
          litter_name: 'Luna & Max Litter', 
          dam_id: 1, 
          sire_id: 2, 
          dam_name: 'Luna', 
          sire_name: 'Max',
          whelp_date: '2025-04-15',
          dam_info: { id: 1, name: 'Luna' },
          sire_info: { id: 2, name: 'Max' }
        })}
      >
        Create Litter
      </button>
      <button 
        data-testid="update-litter" 
        onClick={() => updateLitter({ 
          id: 1, 
          litter_name: 'Luna & Max Spring Litter', 
          dam_id: 1, 
          sire_id: 2,
          dam_name: 'Luna', 
          sire_name: 'Max',
          dam_info: { id: 1, name: 'Luna' },
          sire_info: { id: 2, name: 'Max' }
        })}
      >
        Update Litter
      </button>
      <button data-testid="delete-litter" onClick={() => deleteLitter(1)}>Delete Litter</button>
      <button data-testid="update-status" onClick={() => setLitterStatus(1, 'Born')}>Update Status</button>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error-state">{error ? error : 'No Error'}</div>
      <div data-testid="litters-count">{litters ? litters.length : 0}</div>
      <pre data-testid="active-litter">{JSON.stringify(activeLitter, null, 2)}</pre>
    </div>
  );
};

describe('LitterContext', () => {
  const mockLitters = [
    { 
      id: 1, 
      litter_name: 'Luna & Max Litter', 
      dam_id: 1, 
      sire_id: 2, 
      dam_name: 'Luna', 
      sire_name: 'Max',
      status: 'Planned',
      whelp_date: '2025-04-15'
    },
    { 
      id: 2, 
      litter_name: 'Bella & Rocky Litter', 
      dam_id: 3, 
      sire_id: 4, 
      dam_name: 'Bella', 
      sire_name: 'Rocky',
      status: 'Born',
      whelp_date: '2025-03-01'
    }
  ];

  const mockLitter = { 
    id: 1, 
    litter_name: 'Luna & Max Litter', 
    dam_id: 1, 
    sire_id: 2, 
    dam_name: 'Luna', 
    sire_name: 'Max',
    status: 'Planned',
    whelp_date: '2025-04-15',
    dam_info: { id: 1, name: 'Luna', breed_id: 1, breed_name: 'Golden Retriever' },
    sire_info: { id: 2, name: 'Max', breed_id: 1, breed_name: 'Golden Retriever' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'litters') {
        return Promise.resolve({
          ok: true,
          data: mockLitters
        });
      } else if (endpoint === 'litters/1') {
        return Promise.resolve({
          ok: true,
          data: mockLitter
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    apiPost.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { id: 3, ...mockLitter, litter_name: 'New Litter' } 
      })
    );
    
    apiPut.mockImplementation(() => 
      Promise.resolve({ 
        ok: true, 
        data: { ...mockLitter, litter_name: 'Updated Litter' } 
      })
    );
    
    apiDelete.mockImplementation(() => 
      Promise.resolve({ ok: true })
    );
  });
  
  const renderTestComponent = () => {
    return render(
      <LitterProvider>
        <TestComponent />
      </LitterProvider>
    );
  };
  
  test('fetches litters successfully', async () => {
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-litters'));
    
    // Check loading state
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Verify litters count
    expect(screen.getByTestId('litters-count')).toHaveTextContent('2');
  });
  
  test('fetches a single litter successfully', async () => {
    renderTestComponent();
    
    // Click the fetch litter button
    fireEvent.click(screen.getByTestId('fetch-litter'));
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters/1');
      expect(screen.getByTestId('active-litter')).toHaveTextContent('Luna & Max Litter');
    });
  });
  
  test('creates a litter with sanitized data', async () => {
    renderTestComponent();
    
    // Click the create button
    fireEvent.click(screen.getByTestId('create-litter'));
    
    // Wait for create to complete
    await waitFor(() => {
      // Verify apiPost was called with sanitized data
      expect(apiPost).toHaveBeenCalled();
      
      // Get the data passed to apiPost
      const postData = apiPost.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(postData.dam_name).toBeUndefined();
      expect(postData.sire_name).toBeUndefined();
      expect(postData.dam_info).toBeUndefined();
      expect(postData.sire_info).toBeUndefined();
      
      // Check that schema fields were included
      expect(postData.litter_name).toBe('Luna & Max Litter');
      expect(postData.dam_id).toBe(1);
      expect(postData.sire_id).toBe(2);
      expect(postData.whelp_date).toBe('2025-04-15');
    });
  });
  
  test('updates a litter with sanitized data', async () => {
    renderTestComponent();
    
    // Click the update button
    fireEvent.click(screen.getByTestId('update-litter'));
    
    // Wait for update to complete
    await waitFor(() => {
      // Verify apiPut was called with sanitized data
      expect(apiPut).toHaveBeenCalled();
      
      // Get the data passed to apiPut
      const putData = apiPut.mock.calls[0][1];
      
      // Check that non-schema fields were removed
      expect(putData.dam_name).toBeUndefined();
      expect(putData.sire_name).toBeUndefined();
      expect(putData.dam_info).toBeUndefined();
      expect(putData.sire_info).toBeUndefined();
      
      // Check that schema fields were included
      expect(putData.id).toBe(1);
      expect(putData.litter_name).toBe('Luna & Max Spring Litter');
      expect(putData.dam_id).toBe(1);
      expect(putData.sire_id).toBe(2);
    });
  });
  
  test('deletes a litter successfully', async () => {
    renderTestComponent();
    
    // Click the delete button
    fireEvent.click(screen.getByTestId('delete-litter'));
    
    // Wait for delete to complete
    await waitFor(() => {
      // Verify apiDelete was called with correct endpoint
      expect(apiDelete).toHaveBeenCalledWith('litters/1');
    });
  });
  
  test('updates litter status successfully', async () => {
    renderTestComponent();
    
    // Click the update status button
    fireEvent.click(screen.getByTestId('update-status'));
    
    // Wait for status update to complete
    await waitFor(() => {
      // Verify apiPut was called with correct data
      expect(apiPut).toHaveBeenCalled();
      
      // Get the data passed to apiPut
      const putData = apiPut.mock.calls[0][1];
      
      // Check status was updated
      expect(putData.status).toBe('Born');
    });
  });
  
  test('handles API errors gracefully', async () => {
    // Mock an API error
    apiGet.mockImplementation(() => 
      Promise.resolve({ 
        ok: false, 
        error: 'Failed to fetch litters' 
      })
    );
    
    renderTestComponent();
    
    // Click the fetch button
    fireEvent.click(screen.getByTestId('fetch-litters'));
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to fetch litters');
    });
  });
});
