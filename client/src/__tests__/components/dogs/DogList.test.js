import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dogs from '../../../pages/dogs/Dogs';
import DogContext from '../../../context/DogContext';
import '@testing-library/jest-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Dogs Component', () => {
  const mockDogs = [
    { 
      id: 1, 
      registered_name: 'Max', 
      breed_id: 1, 
      gender: 'Male',
      status: 'Active',
      cover_photo: null 
    },
    { 
      id: 2, 
      registered_name: 'Bella', 
      breed_id: 2, 
      gender: 'Female',
      status: 'Active',
      cover_photo: 'https://example.com/bella.jpg' 
    }
  ];

  const mockDogContext = {
    dogs: mockDogs,
    loading: false,
    error: null
  };

  const renderDogs = (context = mockDogContext) => {
    return render(
      <MemoryRouter>
        <DogContext.Provider value={context}>
          <Dogs />
        </DogContext.Provider>
      </MemoryRouter>
    );
  };

  test('renders the dogs page with correct title', () => {
    renderDogs();
    expect(screen.getByText('Manage Dogs')).toBeInTheDocument();
  });

  test('renders a list of dogs from context', () => {
    renderDogs();
    
    // Check if dog names are displayed
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Bella')).toBeInTheDocument();
    
    // Check if gender and status are displayed
    expect(screen.getByText('Male - Active')).toBeInTheDocument();
    expect(screen.getByText('Female - Active')).toBeInTheDocument();
  });

  test('displays icon when no cover photo is available', () => {
    renderDogs();
    // We can't directly test for the FontAwesome icon, but we can check for its container class
    const dogCards = document.querySelectorAll('.dog-card');
    expect(dogCards[0].querySelector('.dog-icon')).not.toBeNull();
  });

  test('displays cover photo when available', () => {
    renderDogs();
    const images = screen.getAllByRole('img');
    const bellaImage = images.find(img => img.alt === 'Bella');
    expect(bellaImage).toBeInTheDocument();
    expect(bellaImage.src).toBe('https://example.com/bella.jpg');
  });

  test('navigates to add dog page when add button is clicked', () => {
    renderDogs();
    const addButton = screen.getByText('+ Add Dog');
    fireEvent.click(addButton);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dogs/add');
  });

  test('navigates to dog detail page when a dog card is clicked', () => {
    renderDogs();
    const dogCards = document.querySelectorAll('.dog-card');
    fireEvent.click(dogCards[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/dogs/edit/1');
  });

  test('displays message when no dogs are found', () => {
    renderDogs({ ...mockDogContext, dogs: [] });
    expect(screen.getByText('No dogs found. Try adding one.')).toBeInTheDocument();
  });
});
