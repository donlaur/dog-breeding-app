import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DogDetailPage from '../../../pages/dogs/DogDetailPage';
import '@testing-library/jest-dom';
import { useApi } from '../../../hooks/useApi';

// Mock the useApi hook
jest.mock('../../../hooks/useApi', () => ({
  useApi: jest.fn()
}));

// Mock the useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

// Mock the photoUtils
jest.mock('../../../utils/photoUtils', () => ({
  getPhotoUrl: jest.fn(photo => photo || 'default-image-url'),
  handleImageError: jest.fn(),
  DEFAULT_DOG_IMAGE: 'default-dog-image-url'
}));

// Mock the ageUtils
jest.mock('../../../utils/ageUtils', () => ({
  getDogAge: jest.fn(() => '2 years')
}));

describe('DogDetailPage Component', () => {
  // Mock API responses
  const mockDog = {
    id: 1,
    registered_name: 'Max',
    call_name: 'Maxie',
    breed_id: 1,
    breed_name: 'Golden Retriever',
    gender: 'Male',
    date_of_birth: '2022-05-15',
    color: 'Golden',
    weight_kg: 30,
    microchip: '123456789012345',
    registration_number: 'AKC123456',
    status: 'Active',
    dam_id: 2,
    dam_name: 'Luna',
    sire_id: 3,
    sire_name: 'Rocky',
    cover_photo: null
  };

  const mockRelatedLitters = [
    {
      id: 1,
      whelp_date: '2023-06-15',
      dam_id: 1,
      sire_id: 3,
      expected_date: '2023-06-10',
      status: 'Completed',
      puppies_count: 6
    }
  ];

  const mockRelatedDogs = [
    {
      id: 4,
      registered_name: 'Charlie',
      breed_name: 'Golden Retriever',
      gender: 'Male',
      date_of_birth: '2023-06-15',
      status: 'Active'
    }
  ];

  // Mock API functions
  const mockGet = jest.fn();
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Setup useApi mock
    mockGet.mockImplementation((endpoint) => {
      if (endpoint === `/dogs/1`) {
        return Promise.resolve(mockDog);
      } else if (endpoint.includes('litters?dam_id=1') || endpoint.includes('litters?sire_id=1')) {
        return Promise.resolve(mockRelatedLitters);
      } else if (endpoint.includes('dogs?dam_id=1') || endpoint.includes('dogs?sire_id=1')) {
        return Promise.resolve(mockRelatedDogs);
      }
      return Promise.resolve(null);
    });
    
    useApi.mockReturnValue({
      get: mockGet
    });
  });

  test('fetches and displays dog details', async () => {
    render(
      <MemoryRouter>
        <DogDetailPage />
      </MemoryRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/dogs/1');
    });
    
    // Check for dog name in title (this might be in a header)
    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });
    
    // Check for basic dog information
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    
    // Verify the microchip and registration number are displayed
    expect(screen.getByText('123456789012345')).toBeInTheDocument();
    expect(screen.getByText('AKC123456')).toBeInTheDocument();
  });
  
  test('displays related litters for female dogs', async () => {
    // Override the mock for a female dog
    const femaleDog = { ...mockDog, gender: 'Female' };
    
    mockGet.mockImplementation((endpoint) => {
      if (endpoint === `/dogs/1`) {
        return Promise.resolve(femaleDog);
      } else if (endpoint.includes('litters?dam_id=1')) {
        return Promise.resolve(mockRelatedLitters);
      } else {
        return Promise.resolve([]);
      }
    });
    
    render(
      <MemoryRouter>
        <DogDetailPage />
      </MemoryRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/dogs/1');
    });
    
    // Verify related litters fetch was called
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('litters?dam_id=1');
    });
  });
  
  test('handles API error gracefully', async () => {
    // Override the mock to simulate an error
    mockGet.mockRejectedValueOnce(new Error('Failed to fetch dog'));
    
    render(
      <MemoryRouter>
        <DogDetailPage />
      </MemoryRouter>
    );
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/dogs/1');
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  // Note: Add tests for other functionalities like tab switching, navigation, etc.
});
