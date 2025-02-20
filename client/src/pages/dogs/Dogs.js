import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDog } from '@fortawesome/free-solid-svg-icons';
import DogContext from '../../context/DogContext';
import './Dogs.css';

const Dogs = () => {
  const { dogs } = useContext(DogContext);
  const navigate = useNavigate();

  return (
    <div className="dogs-container">
      <h2 className="page-title">Manage Dogs</h2>

      <div className="filter-group">
        <button onClick={() => navigate("/dashboard/dogs/add")} className="add-dog-btn">+ Add Dog</button>
      </div>

      <div className="dog-grid">
        {dogs.length === 0 ? (
          <p>No dogs found. Try adding one.</p>
        ) : (
          dogs.map((dog) => (
            <div key={dog.id} className="dog-card" onClick={() => navigate(`/dashboard/dogs/edit/${dog.id}`)}>
              {dog.cover_photo ? (
                <img src={dog.cover_photo} alt={dog.registered_name} className="dog-image" />
              ) : (
                <FontAwesomeIcon icon={faDog} className="dog-icon" />
              )}
              <h3>{dog.registered_name}</h3>
              <p>{dog.gender} - {dog.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dogs;
