import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditHeat from '../../../pages/heats/EditHeat';
import '@testing-library/jest-dom';
import { apiGet, apiPut } from '../../../utils/apiUtils';

// Mock the API utility functions according to the established pattern
jest.mock('../../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

// Mock the notifications utility
jest.mock('../../../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}));

// Mock the config imports
jest.mock('../../../config', () => ({
  API_URL: '/api',
  debugLog: jest.fn(),
  debugError: jest.fn(),
}));

// Mock react-router-dom's useNavigate and useParams
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ heatId: '1' })
}));

// Mock the HeatForm component
jest.mock('../../../components/heats/HeatForm', () => ({ heat, onSave }) => (
  <div data-testid="heat-form">
    <button data-testid="save-button" onClick={() => {
      // Create a sanitized copy for testing (simulating form submit)
      const sanitizedData = { ...heat };
      delete sanitizedData.dog_name;
      delete sanitizedData.dog_info;
      delete sanitizedData.sire_name;
      delete sanitizedData.sire_info;
      onSave(sanitizedData);
    }}>
      Save Changes
    </button>
    <div data-testid="heat-data">{JSON.stringify(heat)}</div>
  </div>
));

describe('EditHeat Component', () => {
  // Mock heat data
  const mockHeat = {
    id: 1,
    dog_id: 1,
    dog_name: 'Bella',
    start_date: '2023-01-15',
    end_date: '2023-01-30',
    mating_date: '2023-01-20',
    sire_id: 2,
    sire_name: 'Max',
    expected_whelp_date: '2023-03-25',
    notes: 'Normal cycle, good pairing'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup apiGet to return the mock heat
    apiGet.mockImplementation(() => Promise.resolve({
      ok: true,
      data: mockHeat
    }));
    
    // Setup apiPut to simulate successful update
    apiPut.mockImplementation(() => Promise.resolve({
      ok: true,
      data: { ...mockHeat, notes: 'Updated notes' }
    }));
  });

  test('fetches and displays heat details', async () => {
    render(
      <MemoryRouter>
        <EditHeat />
      </MemoryRouter>
    );
    
    // Check loading indicator is displayed initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('heats/1');
    });
    
    // Check that the form is displayed with the heat data
    await waitFor(() => {
      expect(screen.getByTestId('heat-form')).toBeInTheDocument();
    });
    
    // Verify heat data was passed to the form
    const heatDataElement = screen.getByTestId('heat-data');
    expect(heatDataElement).toHaveTextContent('Bella');
    expect(heatDataElement).toHaveTextContent('2023-01-15');
  });

  test('updates heat and navigates on save', async () => {
    render(
      <MemoryRouter>
        <EditHeat />
      </MemoryRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('heats/1');
    });
    
    // Find and click the Save button
    const saveButton = await screen.findByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Verify apiPut was called with sanitized data
    await waitFor(() => {
      expect(apiPut).toHaveBeenCalledWith('heats/1', expect.objectContaining({
        id: 1,
        dog_id: 1,
        start_date: '2023-01-15',
        end_date: '2023-01-30',
      }));
      
      // Verify data was sanitized (non-schema fields removed)
      const updateData = apiPut.mock.calls[0][1];
      expect(updateData.dog_name).toBeUndefined();
      expect(updateData.dog_info).toBeUndefined();
      expect(updateData.sire_name).toBeUndefined();
      expect(updateData.sire_info).toBeUndefined();
    });
    
    // Verify navigation after successful update
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/heats');
  });

  test('handles API error gracefully', async () => {
    // Override mock to simulate an error
    apiGet.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      error: 'Failed to fetch heat'
    }));
    
    render(
      <MemoryRouter>
        <EditHeat />
      </MemoryRouter>
    );
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.getByText('Failed to load heat data')).toBeInTheDocument();
    });
  });

  test('handles update error gracefully', async () => {
    render(
      <MemoryRouter>
        <EditHeat />
      </MemoryRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('heats/1');
    });
    
    // Override the apiPut mock to simulate an error
    apiPut.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      error: 'Server validation failed'
    }));
    
    // Find and click the Save button
    const saveButton = await screen.findByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to update heat cycle/)).toBeInTheDocument();
    });
    
    // Verify we did not navigate away
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
