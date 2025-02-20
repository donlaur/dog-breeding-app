// src/pages/LitterCard.js
import React from "react";
import "./styles/LitterCard.css";

const LitterCard = ({ litter }) => {
  return (
    <div className="litter-card">
      {litter.cover_photo && (
        <img
          src={litter.cover_photo}
          alt={`${litter.litter_name} Cover`}
          className="litter-card-cover-photo"
        />
      )}
      <h3>{litter.litter_name}</h3>
      <p>
        <strong>Born:</strong> {litter.birth_date}
      </p>
      <p>
        <strong>Price:</strong> ${litter.price}
      </p>
      <p>
        <strong>Deposit:</strong> ${litter.deposit}
      </p>
      <p>
        <strong>Sire:</strong> {litter.sire_id}
      </p>
      <p>
        <strong>Dam:</strong> {litter.dam_id}
      </p>
      <p>
        <strong>Puppies:</strong> {litter.num_puppies}
      </p>
    </div>
  );
};

export default LitterCard;
