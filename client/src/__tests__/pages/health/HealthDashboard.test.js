import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HealthDashboard from '../../../pages/health/HealthDashboard';
import { HealthContext } from '../../../context/HealthContext';
import { apiGet } from '../../../utils/apiUtils';

// Mock API utils
jest.mock('../../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
}));

// Mock the useHealth hook to control the context values
const mockHealthContextValue = {
  dashboardData: {
    upcoming_vaccinations: { count: 0, items: [] },
    active_medications: { count: 0, items: [] },
    active_conditions: { count: 0, items: [] },
    recent_records: { count: 0, items: [] }
  },
  fetchDashboardData: jest.fn(),
  isLoading: false,
  error: null
};

describe('HealthDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders health dashboard with data', async () => {
    // Create a mock with data
    const mockWithData = {
      ...mockHealthContextValue,
      dashboardData: {
        upcoming_vaccinations: { 
          count: 2, 
          items: [
            { id: 1, vaccine_name: 'Rabies', due_date: '2025-04-01', dog_name: 'Max' },
            { id: 2, vaccine_name: 'Distemper', due_date: '2025-03-20', dog_name: 'Bella' }
          ]
        },
        active_medications: { 
          count: 1, 
          items: [
            { id: 3, medication_name: 'Antibiotics', end_date: '2025-03-25', dog_name: 'Charlie' }
          ]
        },
        active_conditions: { count: 0, items: [] },
        recent_records: { 
          count: 3, 
          items: [
            { id: 4, record_type: 'Checkup', record_date: '2025-03-01', dog_name: 'Luna' },
            { id: 5, record_type: 'Surgery', record_date: '2025-02-15', dog_name: 'Max' },
            { id: 6, record_type: 'Vaccination', record_date: '2025-02-10', dog_name: 'Bella' }
          ]
        }
      }
    };

    render(
      <MemoryRouter>
        <HealthContext.Provider value={mockWithData}>
          <HealthDashboard />
        </HealthContext.Provider>
      </MemoryRouter>
    );

    // Check that dashboard sections are rendered with data
    expect(screen.getByText(/Health Dashboard/i)).toBeInTheDocument();
    
    // Check upcoming vaccinations
    const rabiesVaccination = screen.getByText(/Rabies/i);
    expect(rabiesVaccination).toBeInTheDocument();
    
    // Check active medications
    const antibiotics = screen.getByText(/Antibiotics/i);
    expect(antibiotics).toBeInTheDocument();
    
    // Check recent health records
    const checkupRecord = screen.getByText(/Checkup/i);
    expect(checkupRecord).toBeInTheDocument();
    
    // Verify fetchDashboardData was called on component mount
    expect(mockWithData.fetchDashboardData).toHaveBeenCalledTimes(1);
  });

  test('renders loading state', async () => {
    // Create a mock with loading state
    const mockLoading = {
      ...mockHealthContextValue,
      isLoading: true
    };

    render(
      <MemoryRouter>
        <HealthContext.Provider value={mockLoading}>
          <HealthDashboard />
        </HealthContext.Provider>
      </MemoryRouter>
    );

    // Check for loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('handles error state correctly', async () => {
    // Create a mock with error state
    const mockWithError = {
      ...mockHealthContextValue,
      error: 'Failed to fetch dashboard data'
    };

    render(
      <MemoryRouter>
        <HealthContext.Provider value={mockWithError}>
          <HealthDashboard />
        </HealthContext.Provider>
      </MemoryRouter>
    );

    // Check for error message
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch dashboard data/i)).toBeInTheDocument();
  });
});
