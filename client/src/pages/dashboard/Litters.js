import React, { useState, useEffect } from 'react';

const Litters = () => {
  const [litters, setLitters] = useState([]);
  const [newLitter, setNewLitter] = useState({
    program_id: '',
    breed_id: '',
    sire_id: '',
    dam_id: '',
    birth_date: '',
    num_puppies: '',
  });

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/litters')
      .then((response) => response.json())
      .then((data) => {
        setLitters(data);
      })
      .catch((error) => console.error('Error fetching litters:', error));
  }, []);

  const handleChange = (e) => {
    setNewLitter({ ...newLitter, [e.target.name]: e.target.value });
  };

  const handleAddLitter = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/litters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLitter),
    })
      .then((response) => response.json())
      .then((data) => {
        setLitters([...litters, data]);
        setNewLitter({ program_id: '', breed_id: '', sire_id: '', dam_id: '', birth_date: '', num_puppies: '' }); // Reset form
      })
      .catch((error) => console.error('Error adding litter:', error));
  };

  return (
    <div>
      <h2>Manage Litters</h2>
      <ul>
        {litters.map((litter) => (
          <li key={litter.id}>
            <strong>Born:</strong> {litter.birth_date} | Sire ID: {litter.sire_id} | Dam ID: {litter.dam_id} | Puppies: {litter.num_puppies}
          </li>
        ))}
      </ul>

      <h3>Add New Litter</h3>
      <form onSubmit={handleAddLitter}>
        <input type="text" name="program_id" placeholder="Program ID" value={newLitter.program_id} onChange={handleChange} required />
        <input type="text" name="breed_id" placeholder="Breed ID" value={newLitter.breed_id} onChange={handleChange} required />
        <input type="text" name="sire_id" placeholder="Sire ID" value={newLitter.sire_id} onChange={handleChange} required />
        <input type="text" name="dam_id" placeholder="Dam ID" value={newLitter.dam_id} onChange={handleChange} required />
        <input type="date" name="birth_date" value={newLitter.birth_date} onChange={handleChange} required />
        <input type="number" name="num_puppies" placeholder="Number of Puppies" value={newLitter.num_puppies} onChange={handleChange} required />
        <button type="submit">Add Litter</button>
      </form>
    </div>
  );
};

export default Litters;
