// src/pages/LitterCard.js
import React from "react";
import "./LitterCard.css"; // optional

const LitterCard = ({ litter }) => {
  return (
    <div className="litter-card">
      <p><strong>Born:</strong> {litter.birth_date}</p>
      <p><strong>Sire ID:</strong> {litter.sire_id}</p>
      <p><strong>Dam ID:</strong> {litter.dam_id}</p>
      <p><strong>Puppies:</strong> {litter.num_puppies}</p>
    </div>
  );
};

export default LitterCard;
