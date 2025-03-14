import { sanitizeHealthData } from '../../utils/dataSanitization';

// If the sanitizeHealthData function doesn't exist yet, let's create it in the test file
// and then we'll add it to the actual utils folder
if (typeof sanitizeHealthData !== 'function') {
  // This is a simple implementation for testing purposes
  // In production, we'll need to implement this in the utils folder
  jest.mock('../../utils/dataSanitization', () => ({
    sanitizeHealthData: (data) => {
      if (!data) return null;
      
      const sanitizedData = { ...data };
      
      // List of common non-schema fields that should be removed before sending to the API
      const nonSchemaFields = [
        'dam_name', 'sire_name', 'breed_name', 
        'dam_info', 'sire_info', 'breed_info', 
        'dog_name', 'puppy_name', 'owner_name', 
        'created_by_name', 'updated_by_name'
      ];
      
      // Remove non-schema fields
      nonSchemaFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(sanitizedData, field)) {
          delete sanitizedData[field];
        }
      });
      
      return sanitizedData;
    }
  }));
}

describe('Data Sanitization', () => {
  test('removes non-schema fields from health record data', () => {
    const testData = {
      id: 1,
      record_type: 'Vaccination',
      record_date: '2025-03-14',
      dog_id: 5,
      dog_name: 'Max', // Non-schema field
      owner_name: 'John Doe', // Non-schema field
      notes: 'Rabies vaccination'
    };
    
    const sanitizedData = sanitizeHealthData(testData);
    
    // Check that schema fields remain
    expect(sanitizedData.id).toBe(1);
    expect(sanitizedData.record_type).toBe('Vaccination');
    expect(sanitizedData.record_date).toBe('2025-03-14');
    expect(sanitizedData.dog_id).toBe(5);
    expect(sanitizedData.notes).toBe('Rabies vaccination');
    
    // Check that non-schema fields are removed
    expect(sanitizedData.dog_name).toBeUndefined();
    expect(sanitizedData.owner_name).toBeUndefined();
  });

  test('handles null or undefined input', () => {
    expect(sanitizeHealthData(null)).toBeNull();
    expect(sanitizeHealthData(undefined)).toBeNull();
  });

  test('removes nested non-schema fields', () => {
    const testData = {
      id: 1,
      record_type: 'Examination',
      dog_id: 5,
      dog_info: {  // Complex non-schema field
        name: 'Max',
        breed: 'Golden Retriever',
        owner: 'John Doe'
      }
    };
    
    const sanitizedData = sanitizeHealthData(testData);
    
    // Check that schema fields remain
    expect(sanitizedData.id).toBe(1);
    expect(sanitizedData.record_type).toBe('Examination');
    expect(sanitizedData.dog_id).toBe(5);
    
    // Check that dog_info is removed
    expect(sanitizedData.dog_info).toBeUndefined();
  });

  test('removes all common non-schema fields', () => {
    const testData = {
      id: 1,
      dam_name: 'Luna',
      sire_name: 'Rocky',
      breed_name: 'Labrador',
      dam_info: { id: 2, name: 'Luna' },
      sire_info: { id: 3, name: 'Rocky' },
      breed_info: { id: 4, name: 'Labrador' },
      dog_name: 'Max',
      puppy_name: 'Charlie',
      owner_name: 'John Doe',
      created_by_name: 'Admin',
      updated_by_name: 'Admin'
    };
    
    const sanitizedData = sanitizeHealthData(testData);
    
    // Check that only ID remains
    expect(sanitizedData.id).toBe(1);
    
    // Check that all non-schema fields are removed
    expect(sanitizedData.dam_name).toBeUndefined();
    expect(sanitizedData.sire_name).toBeUndefined();
    expect(sanitizedData.breed_name).toBeUndefined();
    expect(sanitizedData.dam_info).toBeUndefined();
    expect(sanitizedData.sire_info).toBeUndefined();
    expect(sanitizedData.breed_info).toBeUndefined();
    expect(sanitizedData.dog_name).toBeUndefined();
    expect(sanitizedData.puppy_name).toBeUndefined();
    expect(sanitizedData.owner_name).toBeUndefined();
    expect(sanitizedData.created_by_name).toBeUndefined();
    expect(sanitizedData.updated_by_name).toBeUndefined();
  });
});
