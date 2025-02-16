// AddLitterPage.js
import React from "react";
import LitterForm from "./LitterForm";

const AddLitterPage = () => {
  const handleSave = (newLitter) => {
    // POST newLitter to /api/litters
    // upon success, navigate back to /dashboard/litters
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h2>Add a New Litter</h2>
      <LitterForm onSave={handleSave} />
    </div>
  );
};

export default AddLitterPage;
