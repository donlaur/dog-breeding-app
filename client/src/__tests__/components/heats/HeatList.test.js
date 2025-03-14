import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeatList from '../../../components/heats/HeatList';
import '@testing-library/jest-dom';

describe('HeatList Component', () => {
  // Mock data for tests
  const mockHeats = [
    {
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
    },
    {
      id: 2,
      dog_id: 3,
      dog_name: 'Luna',
      start_date: '2023-02-10',
      end_date: '2023-02-25',
      mating_date: null,
      sire_id: null,
      sire_name: null,
      expected_whelp_date: null,
      notes: 'First heat cycle, tracking only'
    }
  ];

  // Mock function for setHeats
  const mockSetHeats = jest.fn();

  // Helper to format dates consistently for testing
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders heat list with correct data', () => {
    render(
      <MemoryRouter>
        <HeatList heats={mockHeats} setHeats={mockSetHeats} />
      </MemoryRouter>
    );
    
    // Check dog names are displayed
    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
    
    // Check for mated pair indication
    expect(screen.getByText('& Max')).toBeInTheDocument();
    
    // Check dates are formatted and displayed correctly
    expect(screen.getByText(formatDate('2023-01-15'))).toBeInTheDocument(); // Start date
    expect(screen.getByText(formatDate('2023-01-30'))).toBeInTheDocument(); // End date
    expect(screen.getByText(formatDate('2023-01-20'))).toBeInTheDocument(); // Mating date
    expect(screen.getByText(formatDate('2023-03-25'))).toBeInTheDocument(); // Expected whelp date
    
    // Check notes are displayed
    expect(screen.getByText('Normal cycle, good pairing')).toBeInTheDocument();
    expect(screen.getByText('First heat cycle, tracking only')).toBeInTheDocument();
  });

  test('edit button links to correct route', () => {
    render(
      <MemoryRouter>
        <HeatList heats={mockHeats} setHeats={mockSetHeats} />
      </MemoryRouter>
    );
    
    const editButtons = screen.getAllByText('EDIT');
    expect(editButtons[0]).toHaveAttribute('href', '/dashboard/heats/1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/dashboard/heats/2/edit');
  });

  test('delete button removes heat from list', () => {
    render(
      <MemoryRouter>
        <HeatList heats={mockHeats} setHeats={mockSetHeats} />
      </MemoryRouter>
    );
    
    const deleteButtons = screen.getAllByText('DELETE');
    fireEvent.click(deleteButtons[0]); // Delete first heat
    
    // Check that setHeats was called with the filtered array
    expect(mockSetHeats).toHaveBeenCalledTimes(1);
    expect(mockSetHeats).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 2 })
      ])
    );
    expect(mockSetHeats).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({ id: 1 })
      ])
    );
  });

  test('shows active/completed status correctly', () => {
    // Mock current date to ensure consistent test results
    const mockDate = new Date('2023-01-25');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    render(
      <MemoryRouter>
        <HeatList heats={mockHeats} setHeats={mockSetHeats} />
      </MemoryRouter>
    );
    
    // First heat should be active (end_date > current date)
    const statusChips = screen.getAllByRole('button'); // MUI Chips have role="button"
    expect(statusChips[0]).toHaveTextContent('active');
    
    // Restore Date implementation
    global.Date.mockRestore();
  });

  test('handles heats with no mating information', () => {
    render(
      <MemoryRouter>
        <HeatList heats={mockHeats} setHeats={mockSetHeats} />
      </MemoryRouter>
    );
    
    // Second heat has no mating date, sire, or expected whelp date
    // These elements should not be present for the second heat
    const heatPapers = screen.getAllByRole('article');
    const secondHeatPaper = heatPapers[1];
    
    // Check that mating date section is not present
    expect(secondHeatPaper).not.toHaveTextContent('Mating:');
    expect(secondHeatPaper).not.toHaveTextContent('Expected Whelp:');
  });
});
