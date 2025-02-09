import React, { useState, useEffect } from 'react';

const Dogs = () => {
  const [dogs, setDogs] = useState([]);
  const [newDog, setNewDog] = useState({
    registered_name: '',
    call_name: '',
    breed_id: '',
    gender: '',
    birth_date: '',
    status: 'Active',
    breeder_id: '',
  });

  // Fetch all dogs
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/dogs')
      .then((response) => response.json())
      .then((data) => setDogs(data))
      .catch((error) => console.error('Error fetching dogs:', error));
  }, []);

  const handleChange = (e) => {
    setNewDog({ ...newDog, [e.target.name]: e.target.value });
  };

  const handleAddDog = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/dogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDog),
    })
      .then((response) => response.json())
      .then((data) => setDogs([...dogs, data]))
      .catch((error) => console.error('Error adding dog:', error));
  };

  return (
    <div>
      <h2>Manage Dogs</h2>
      <ul>
        {dogs.map((dog) => (
          <li key={dog.id}>
            <strong>{dog.registered_name}</strong> ({dog.call_name}) - {dog.gender}, DOB: {dog.birth_date}, Status: {dog.status}
          </li>
        ))}
      </ul>

      <h3>Add New Dog</h3>
      <form onSubmit={handleAddDog}>
        <input type="text" name="registered_name" placeholder="Registered Name" value={newDog.registered_name} onChange={handleChange} required />
        <input type="text" name="call_name" placeholder="Call Name" value={newDog.call_name} onChange={handleChange} />
        <input type="text" name="breed_id" placeholder="Breed ID" value={newDog.breed_id} onChange={handleChange} required />
        <input type="text" name="gender" placeholder="Gender" value={newDog.gender} onChange={handleChange} required />
        <input type="date" name="birth_date" placeholder="Birth Date" value={newDog.birth_date} onChange={handleChange} required />
        <input type="text" name="status" placeholder="Status" value={newDog.status} onChange={handleChange} />
        <input type="text" name="breeder_id" placeholder="Breeder ID" value={newDog.breeder_id} onChange={handleChange} required />
        <button type="submit">Add Dog</button>
      </form>
    </div>
  );
};

export default Dogs;
