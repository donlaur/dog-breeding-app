import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { DogProvider } from '../../context/DogContext';
import DogContext from '../../context/DogContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';

// Mock the API utility functions
jest.mock('../../utils/apiUtils', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
}));

describe('DogContext', () => {
  let wrapper;
  const TestComponent = () => {
    const dogContext = React.useContext(DogContext);
    wrapper = dogContext;
    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchDogs should fetch dogs and update state', async () => {
    // Mock API response
    const mockDogs = [
      { id: 1, registered_name: 'Max', breed_id: 1, gender: 'Male' },
      { id: 2, registered_name: 'Bella', breed_id: 2, gender: 'Female' }
    ];
    
    apiGet.mockResolvedValueOnce(mockDogs);
    
    // Render the provider
    render(
      <DogProvider>
        <TestComponent />
      </DogProvider>
    );
    
    // Execute the fetchDogs function
    await act(async () => {
      await wrapper.fetchDogs();
    });
    
    // Verify the API was called with the correct endpoint
    expect(apiGet).toHaveBeenCalledWith('dogs');
    
    // Check if the state was updated
    expect(wrapper.dogs).toEqual(mockDogs);
    expect(wrapper.dogsLoading).toBe(false);
    expect(wrapper.dogsError).toBe(null);
  });

  test('fetchDogs should handle errors', async () => {
    // Mock API error
    const errorMessage = 'Failed to fetch dogs';
    apiGet.mockRejectedValueOnce(new Error(errorMessage));
    
    // Render the provider
    render(
      <DogProvider>
        <TestComponent />
      </DogProvider>
    );
    
    // Execute the fetchDogs function
    await act(async () => {
      await wrapper.fetchDogs();
    });
    
    // Verify the API was called with the correct endpoint
    expect(apiGet).toHaveBeenCalledWith('dogs');
    
    // Check if the error state was updated
    expect(wrapper.dogsError).toBeTruthy();
    expect(wrapper.dogsLoading).toBe(false);
  });

  test('createDog should create a dog and update state', async () => {
    // Mock dog data
    const newDog = { 
      registered_name: 'Charlie', 
      breed_id: 1, 
      gender: 'Male',
      status: 'Active'
    };
    
    const createdDog = { 
      id: 3, 
      ...newDog 
    };
    
    // Mock API response
    apiPost.mockResolvedValueOnce(createdDog);
    
    // Render the provider
    render(
      <DogProvider>
        <TestComponent />
      </DogProvider>
    );
    
    // Initial state
    wrapper.dogs = [
      { id: 1, registered_name: 'Max', breed_id: 1, gender: 'Male' },
      { id: 2, registered_name: 'Bella', breed_id: 2, gender: 'Female' }
    ];
    
    // Execute the createDog function
    let result;
    await act(async () => {
      result = await wrapper.createDog(newDog);
    });
    
    // Verify the API was called with the correct endpoint and data
    expect(apiPost).toHaveBeenCalledWith('dogs', newDog);
    
    // Check if the state was updated
    expect(wrapper.dogs).toContainEqual(createdDog);
    expect(result).toBe(true);
  });

  test('updateDog should update a dog and update state', async () => {
    // Mock dog data
    const updatedDog = { 
      id: 1, 
      registered_name: 'Maximus', 
      breed_id: 1, 
      gender: 'Male',
      status: 'Active',
      // Additional fields that should be removed before API call
      breed_name: 'Golden Retriever',
      dam_name: 'Luna',
      sire_name: 'Rocky'
    };
    
    // The cleaned version without non-schema fields
    const cleanedDog = { 
      id: 1, 
      registered_name: 'Maximus', 
      breed_id: 1, 
      gender: 'Male',
      status: 'Active'
    };
    
    // Mock API response
    apiPut.mockResolvedValueOnce(cleanedDog);
    
    // Render the provider
    render(
      <DogProvider>
        <TestComponent />
      </DogProvider>
    );
    
    // Initial state
    wrapper.dogs = [
      { id: 1, registered_name: 'Max', breed_id: 1, gender: 'Male' },
      { id: 2, registered_name: 'Bella', breed_id: 2, gender: 'Female' }
    ];
    
    // Execute the updateDog function
    let result;
    await act(async () => {
      result = await wrapper.updateDog(updatedDog);
    });
    
    // Verify the API was called with the correct endpoint and cleaned data
    // The non-schema fields should be removed before API call
    expect(apiPut).toHaveBeenCalledWith('dogs', expect.not.objectContaining({
      breed_name: 'Golden Retriever',
      dam_name: 'Luna',
      sire_name: 'Rocky'
    }));
    
    // Check if the state was updated
    expect(wrapper.dogs.find(dog => dog.id === 1).registered_name).toBe('Maximus');
    expect(result).toBe(true);
  });

  test('deleteDog should delete a dog and update state', async () => {
    // Mock API response
    apiDelete.mockResolvedValueOnce({ success: true });
    
    // Render the provider
    render(
      <DogProvider>
        <TestComponent />
      </DogProvider>
    );
    
    // Initial state
    wrapper.dogs = [
      { id: 1, registered_name: 'Max', breed_id: 1, gender: 'Male' },
      { id: 2, registered_name: 'Bella', breed_id: 2, gender: 'Female' }
    ];
    
    // Execute the deleteDog function
    let result;
    await act(async () => {
      result = await wrapper.deleteDog(1);
    });
    
    // Verify the API was called with the correct endpoint
    expect(apiDelete).toHaveBeenCalledWith('dogs/1');
    
    // Check if the state was updated
    expect(wrapper.dogs).not.toContainEqual(expect.objectContaining({ id: 1 }));
    expect(wrapper.dogs.length).toBe(1);
    expect(result).toBe(true);
  });
});
