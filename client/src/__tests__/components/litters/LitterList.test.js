import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Litters from '../../../pages/litters/Litters';
import { DogProvider } from '../../../context/DogContext';
import '@testing-library/jest-dom';
import { apiGet, apiDelete } from '../../../utils/apiUtils';

// Mock the API utility functions according to the established pattern
jest.mock('../../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiDelete: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn()
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
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

// Mock the photo utils
jest.mock('../../../utils/photoUtils', () => ({
  getPhotoUrl: jest.fn(url => url || 'default-photo.jpg'),
  DEFAULT_LITTER_IMAGE: 'default-litter.jpg'
}));

describe('Litters Component', () => {
  // Mock data for tests
  const mockLitters = [
    { 
      id: 1, 
      litter_name: 'Luna & Max Litter', 
      dam_id: 1,  
      sire_id: 2, 
      dam_name: 'Luna', 
      sire_name: 'Max',
      status: 'Planned',
      whelp_date: '2025-04-15',
      num_puppies: 0,
      cover_photo: null
    },
    { 
      id: 2, 
      litter_name: 'Bella & Rocky Litter', 
      dam_id: 3, 
      sire_id: 4, 
      dam_name: 'Bella', 
      sire_name: 'Rocky',
      status: 'Born',
      whelp_date: '2025-03-01',
      num_puppies: 5,
      cover_photo: 'bella-litter.jpg'
    }
  ];

  const mockDogs = [
    { id: 1, registered_name: 'Luna', gender: 'Female' },
    { id: 2, registered_name: 'Max', gender: 'Male' },
    { id: 3, registered_name: 'Bella', gender: 'Female' },
    { id: 4, registered_name: 'Rocky', gender: 'Male' }
  ];

  // Setup mock for DogContext
  jest.mock('../../../context/DogContext', () => ({
    ...jest.requireActual('../../../context/DogContext'),
    useDog: () => ({
      litters: mockLitters,
      dogs: mockDogs,
      loading: false,
      refreshData: jest.fn()
    })
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'litters') {
        return Promise.resolve({
          ok: true,
          data: mockLitters
        });
      } else if (endpoint === 'dogs') {
        return Promise.resolve({
          ok: true,
          data: mockDogs
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    apiDelete.mockImplementation(() => 
      Promise.resolve({ ok: true })
    );
  });

  test('renders litters with correct data', async () => {
    render(
      <MemoryRouter>
        <DogProvider>
          <Litters />
        </DogProvider>
      </MemoryRouter>
    );
    
    // Wait for content to be loaded
    await waitFor(() => {
      expect(screen.getByText('Luna & Max Litter')).toBeInTheDocument();
    });
    
    // Check for litter information
    expect(screen.getByText('Bella & Rocky Litter')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Born')).toBeInTheDocument();
  });

  test('navigates to add litter page when Add Litter button is clicked', async () => {
    render(
      <MemoryRouter>
        <DogProvider>
          <Litters />
        </DogProvider>
      </MemoryRouter>
    );
    
    // Wait for content to be loaded
    await waitFor(() => {
      expect(screen.getByText(/Add Litter/i)).toBeInTheDocument();
    });
    
    // Find and click Add Litter button
    fireEvent.click(screen.getByText(/Add Litter/i));
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/litters/add');
  });

  test('renders loading state properly', async () => {
    // Override the DogContext mock for this test
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
    
    render(
      <MemoryRouter>
        <DogProvider>
          <Litters />
        </DogProvider>
      </MemoryRouter>
    );
    
    // Check for loading indicators
    const loadingElements = screen.getAllByRole('progressbar');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('navigates to litter detail page when litter card is clicked', async () => {
    render(
      <MemoryRouter>
        <DogProvider>
          <Litters />
        </DogProvider>
      </MemoryRouter>
    );
    
    // Wait for content to be loaded
    await waitFor(() => {
      expect(screen.getByText('Luna & Max Litter')).toBeInTheDocument();
    });
    
    // Find and click the View Details button on first litter
    const viewButtons = screen.getAllByText(/View Details/i);
    fireEvent.click(viewButtons[0]);
    
    // Verify navigation to detail page
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/litters/1');
  });
});
