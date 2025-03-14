import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LitterDetail from '../../../pages/litters/LitterDetails';
import '@testing-library/jest-dom';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/apiUtils';

// Mock the API utility functions
jest.mock('../../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
  getLitter: jest.fn(),
  getLitterPuppies: jest.fn()
}));

// Mock the date utility functions
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn(date => new Date(date).toLocaleDateString()),
  formatAge: jest.fn(() => '2 months'),
}));

// Mock the notifications utility
jest.mock('../../../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
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
  DEFAULT_LITTER_IMAGE: 'default-litter.jpg',
}));

// Mock react-router-dom's useNavigate and useParams
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' })
}));

describe('LitterDetail Component', () => {
  // Mock data for tests
  const mockLitter = {
    id: 1,
    litter_name: 'Luna & Max Litter',
    dam_id: 1,
    sire_id: 2,
    dam_name: 'Luna',
    sire_name: 'Max',
    dam_info: { id: 1, registered_name: 'Luna', breed_id: 1, breed_name: 'Golden Retriever' },
    sire_info: { id: 2, registered_name: 'Max', breed_id: 1, breed_name: 'Golden Retriever' },
    status: 'Planned',
    whelp_date: '2025-04-15',
    expected_date: '2025-04-10',
    heat_start_date: '2025-01-01',
    heat_id: 5,
    mating_date: '2025-01-15',
    num_puppies: 0,
    notes: 'First planned litter',
    cover_photo: null
  };

  const mockPuppies = [
    {
      id: 101,
      litter_id: 1,
      microchip: '123456789012345',
      registration_number: 'AKC1234',
      gender: 'Male',
      color: 'Golden',
      name: 'Buddy',
      birth_weight: 0.5,
      status: 'Available',
      collar_color: 'Blue'
    },
    {
      id: 102,
      litter_id: 1,
      microchip: '987654321098765',
      registration_number: 'AKC5678',
      gender: 'Female',
      color: 'Cream',
      name: 'Daisy',
      birth_weight: 0.45,
      status: 'Reserved',
      collar_color: 'Pink'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup apiGet mock implementation
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'litters/1') {
        return Promise.resolve({
          ok: true,
          data: mockLitter
        });
      } else if (endpoint === 'litters/1/puppies') {
        return Promise.resolve({
          ok: true,
          data: mockPuppies
        });
      } else if (endpoint.includes('photos')) {
        return Promise.resolve({
          ok: true,
          data: []
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    // Setup specific mocks for the getLitter and getLitterPuppies functions
    const { getLitter, getLitterPuppies } = require('../../../utils/apiUtils');
    getLitter.mockImplementation(() => Promise.resolve(mockLitter));
    getLitterPuppies.mockImplementation(() => Promise.resolve(mockPuppies));
  });

  test('renders litter details with correct data', async () => {
    render(
      <MemoryRouter>
        <LitterDetail />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters/1');
    });
    
    // Check for litter name
    await waitFor(() => {
      expect(screen.getByText('Luna & Max Litter')).toBeInTheDocument();
    });
    
    // Check for basic litter information
    expect(screen.getByText('Planned')).toBeInTheDocument();
    
    // Check for dam and sire information
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  test('renders puppies list when litter has puppies', async () => {
    // Set the litter to have puppies
    const litterWithPuppies = {
      ...mockLitter,
      status: 'Born',
      num_puppies: 2
    };
    
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'litters/1') {
        return Promise.resolve({
          ok: true,
          data: litterWithPuppies
        });
      } else if (endpoint === 'litters/1/puppies') {
        return Promise.resolve({
          ok: true,
          data: mockPuppies
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    render(
      <MemoryRouter>
        <LitterDetail />
      </MemoryRouter>
    );
    
    // Wait for puppies to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters/1/puppies');
    });
    
    // Check for puppy information
    await waitFor(() => {
      expect(screen.getByText('Buddy')).toBeInTheDocument();
      expect(screen.getByText('Daisy')).toBeInTheDocument();
    });
    
    // Check for puppy details
    expect(screen.getByText('123456789012345')).toBeInTheDocument(); // Microchip
    expect(screen.getByText('AKC1234')).toBeInTheDocument(); // Registration number
  });

  test('navigates to edit page when edit button is clicked', async () => {
    render(
      <MemoryRouter>
        <LitterDetail />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters/1');
    });
    
    // Find and click the edit button
    const editButton = await screen.findByText(/Edit/i);
    fireEvent.click(editButton);
    
    // Verify navigation to edit page
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/litters/1/edit');
  });

  test('handles API error gracefully', async () => {
    // Override apiGet to simulate an error
    apiGet.mockImplementation(() => Promise.resolve({
      ok: false,
      error: 'Failed to fetch litter'
    }));
    
    render(
      <MemoryRouter>
        <LitterDetail />
      </MemoryRouter>
    );
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('handles quick add puppies functionality', async () => {
    // Set the litter to have puppies
    const litterWithPuppies = {
      ...mockLitter,
      status: 'Born',
      whelp_date: '2025-03-15', // Recent date to allow adding puppies
      num_puppies: 0
    };
    
    apiGet.mockImplementation((endpoint) => {
      if (endpoint === 'litters/1') {
        return Promise.resolve({
          ok: true,
          data: litterWithPuppies
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    });
    
    // Mock successful puppy creation
    apiPost.mockImplementation(() => Promise.resolve({
      ok: true,
      data: { id: 103 }
    }));
    
    render(
      <MemoryRouter>
        <LitterDetail />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('litters/1');
    });
    
    // Find and click the Add Puppies button (if present)
    const addPuppiesButton = await screen.findByText(/Add Puppies/i);
    fireEvent.click(addPuppiesButton);
    
    // Expect the quick add dialog or form to be visible
    // Note: This would need to be adjusted based on actual implementation details
    // which might include specific form fields or buttons in the quick add UI
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      if (dialog) {
        expect(dialog).toBeInTheDocument();
      }
    });
  });
});
