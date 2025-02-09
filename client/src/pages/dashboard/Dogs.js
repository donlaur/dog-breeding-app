import React, { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDog } from '@fortawesome/free-solid-svg-icons';
import DogContext from '../../context/DogContext';
import Modal from '../../components/Modal';
import './Dogs.css';

const Dogs = () => {
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [editingDog, setEditingDog] = useState(null);
  const [newDog, setNewDog] = useState({
    registered_name: '',
    call_name: '',
    breed_id: '',
    gender: 'Male',
    birth_date: '',
    status: 'Active',
    cover_photo: '',
    additional_photos: []
  });

  const handleChange = (e) => {
    setNewDog({ ...newDog, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDog({ ...newDog, cover_photo: URL.createObjectURL(file) });
    }
  };

  const handleAddDog = (e) => {
    e.preventDefault();

    if (!newDog.registered_name || !newDog.breed_id) {
      alert("Please fill out all required fields.");
      return;
    }

    const apiUrl = editingDog ? `http://127.0.0.1:5000/api/dogs/${editingDog.id}` : `http://127.0.0.1:5000/api/dogs`;
    const method = editingDog ? 'PUT' : 'POST';

    fetch(apiUrl, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newDog,
        birth_date: newDog.birth_date ? new Date(newDog.birth_date).toISOString().split('T')[0] : '',
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (editingDog) {
          setDogs(dogs.map((dog) => (dog.id === editingDog.id ? data : dog)));
        } else {
          setDogs([...dogs, data]);
        }
        setShowForm(false);
        setEditingDog(null);
        setNewDog({
          registered_name: '',
          call_name: '',
          breed_id: '',
          gender: 'Male',
          birth_date: '',
          status: 'Active',
          cover_photo: '',
          additional_photos: []
        });
      })
      .catch((error) => console.error('Error saving dog:', error));
  };

  const handleEditDog = (dog) => {
    setNewDog({
      registered_name: dog.registered_name || '',
      call_name: dog.call_name || '',
      breed_id: dog.breed_id || '',
      gender: dog.gender || 'Male',
      birth_date: dog.birth_date || '',
      status: dog.status || 'Active',
      cover_photo: dog.cover_photo || '',
      additional_photos: dog.additional_photos || []
    });
    setEditingDog(dog);
    setShowForm(true);
  };

  const filteredDogs = filter === "All" ? dogs : dogs.filter(dog => dog.gender === filter);

  return (
    <div className="dogs-container">
      <h2 className="page-title">Manage Dogs</h2>

      <div className="filter-group">
        <button onClick={() => setFilter("All")} className={filter === "All" ? "active" : ""}>All</button>
        <button onClick={() => setFilter("Male")} className={filter === "Male" ? "active" : ""}>Sires</button>
        <button onClick={() => setFilter("Female")} className={filter === "Female" ? "active" : ""}>Dams</button>
      </div>

      <button className="add-dog-btn" onClick={() => { 
        setShowForm(true); 
        setEditingDog(null);
        setNewDog({
          registered_name: '',
          call_name: '',
          breed_id: '',
          gender: 'Male',
          birth_date: '',
          status: 'Active',
          cover_photo: '',
          additional_photos: []
        });
      }}>+ Add Dog</button>

      {/* ✅ MODAL WITH FULL FORM */}
      <Modal show={showForm} onClose={() => setShowForm(false)}>
        <form className="dog-form" onSubmit={handleAddDog}>
          <h3>{editingDog ? "Edit Dog" : "Add New Dog"}</h3>

          <input type="text" name="registered_name" placeholder="Registered Name" value={newDog.registered_name} onChange={handleChange} required />
          <input type="text" name="call_name" placeholder="Call Name" value={newDog.call_name} onChange={handleChange} required />

          <select name="breed_id" value={newDog.breed_id} onChange={handleChange} required>
            <option value="">Select Breed</option>
            {breeds.map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>

          {/* Gender */}
          <div className="radio-group">
            <label><input type="radio" name="gender" value="Male" checked={newDog.gender === 'Male'} onChange={handleChange} /> Male</label>
            <label><input type="radio" name="gender" value="Female" checked={newDog.gender === 'Female'} onChange={handleChange} /> Female</label>
          </div>

          <input type="date" name="birth_date" value={newDog.birth_date} onChange={handleChange} required />

          {/* Status */}
          <div className="radio-group">
            <label><input type="radio" name="status" value="Active" checked={newDog.status === 'Active'} onChange={handleChange} /> Active</label>
            <label><input type="radio" name="status" value="Retired" checked={newDog.status === 'Retired'} onChange={handleChange} /> Retired</label>
            <label><input type="radio" name="status" value="Upcoming" checked={newDog.status === 'Upcoming'} onChange={handleChange} /> Upcoming</label>
          </div>

          {/* Cover Photo */}
          <label>Cover Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {newDog.cover_photo && <img src={newDog.cover_photo} alt="Preview" className="preview-img" />}

          <button type="submit">{editingDog ? "Save Changes" : "Add Dog"}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Dogs;
