import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LitterDetails from '../components/litters/LitterDetails';
import * as apiUtils from '../utils/apiUtils';

// Mock the API utility functions
jest.mock('../utils/apiUtils', () => ({
  getLitter: jest.fn(),
  getLitterPuppies: jest.fn(),
}));

describe('LitterDetails Component', () => {
  const mockLitter = {
    id: 3,
    litter_name: 'Test Litter',
    whelp_date: '2025-02-11',
    dam_id: 20,
    dam_name: 'Madison',
    sire_id: 17,
    sire_name: 'Piggy',
    status: 'Born',
    num_puppies: 7
  };

  const mockPuppies = [
    {
      id: 12,
      name: 'Sinatra',
      gender: 'Male',
      birth_date: '2025-02-11',
      color: 'Red & White',
      litter_id: 3
    },
    {
      id: 13,
      name: 'Elvis',
      gender: 'Male',
      birth_date: '2025-02-11',
      color: 'Black and Tan',
      litter_id: 3
    }
  ];

  beforeEach(() => {
    // Reset mock function calls
    jest.clearAllMocks();
    
    // Setup default mock responses
    apiUtils.getLitter.mockResolvedValue({
      ok: true,
      data: mockLitter
    });
    
    apiUtils.getLitterPuppies.mockResolvedValue({
      ok: true,
      data: mockPuppies
    });
  });

  test('calls getLitter and getLitterPuppies with correct ID', async () => {
    // Render the component with a route parameter
    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for API calls to resolve
    await waitFor(() => {
      // Verify that getLitter was called with the correct ID
      expect(apiUtils.getLitter).toHaveBeenCalledWith('3');
      
      // Verify that getLitterPuppies was called with the correct ID
      expect(apiUtils.getLitterPuppies).toHaveBeenCalledWith('3');
    });
  });

  test('displays litter details correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for litter details to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Litter')).toBeInTheDocument();
      expect(screen.getByText('Dam: Madison')).toBeInTheDocument();
      expect(screen.getByText('Sire: Piggy')).toBeInTheDocument();
      expect(screen.getByText('Whelp Date: 2025-02-11')).toBeInTheDocument();
    });
  });

  test('displays puppies correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for puppies to be displayed
    await waitFor(() => {
      expect(screen.getByText('Sinatra')).toBeInTheDocument();
      expect(screen.getByText('Elvis')).toBeInTheDocument();
    });
  });

  test('handles error when getLitter fails', async () => {
    // Mock getLitter to return an error
    apiUtils.getLitter.mockResolvedValue({
      ok: false,
      error: 'Failed to fetch litter'
    });

    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch litter')).toBeInTheDocument();
    });
  });

  test('handles error when getLitterPuppies fails', async () => {
    // Mock getLitterPuppies to return an error
    apiUtils.getLitterPuppies.mockResolvedValue({
      ok: false,
      error: 'Failed to fetch puppies'
    });

    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch puppies')).toBeInTheDocument();
    });
  });

  test('displays empty state when no puppies are found', async () => {
    // Mock getLitterPuppies to return an empty array
    apiUtils.getLitterPuppies.mockResolvedValue({
      ok: true,
      data: []
    });

    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for empty state message to be displayed
    await waitFor(() => {
      expect(screen.getByText('No puppies found for this litter')).toBeInTheDocument();
    });
  });

  test('puppy links point to the correct route', async () => {
    render(
      <MemoryRouter initialEntries={['/litters/3']}>
        <Routes>
          <Route path="/litters/:id" element={<LitterDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for puppies to be displayed
    await waitFor(() => {
      // Find all the puppy detail links
      const puppyLinks = screen.getAllByText('View Details');
      
      // Verify that each link points to the correct route
      puppyLinks.forEach((link, index) => {
        const puppyId = mockPuppies[index].id;
        expect(link.closest('a')).toHaveAttribute('href', `/dashboard/puppies/${puppyId}`);
      });
    });
  });
});
