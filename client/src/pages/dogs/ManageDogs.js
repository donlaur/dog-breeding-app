// src/pages/dogs/ManageDogs.js
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import DogContext from "../../context/DogContext";
import "../../styles/ManageDogs.css";
import { Box, Button, Typography } from "@mui/material";
import PetsIcon from '@mui/icons-material/Pets';

const ManageDogs = () => {
  const { dogs, setDogs } = useContext(DogContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/dogs/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        debugLog("Dogs data received:", data);
        setDogs(data);
      })
      .catch((error) => {
        debugError("Error fetching dogs:", error);
        debugError("Error details:", error.message);
      });
  }, [setDogs]);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Manage Adult Dogs
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => navigate("/dashboard/dogs/add")}>
          + Add Dog
        </Button>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 2 }}>
        {dogs.length === 0 ? (
          <Typography variant="body1" align="center">
            No adult dogs found. Try adding one.
          </Typography>
        ) : (
          dogs.map((dog) => (
            <Box
              key={dog.id}
              sx={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: 1,
                textAlign: "center",
                cursor: "pointer",
                height: "100%"
              }}
              onClick={() => navigate(`/dashboard/dogs/edit/${dog.id}`)}
            >
              {dog.cover_photo ? (
                <img src={dog.cover_photo} alt={dog.call_name} className="dog-image" />
              ) : (
                <Box
                  sx={{
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f0f0f0"
                  }}
                >
                  <PetsIcon sx={{ fontSize: 80, color: "#ccc" }} />
                </Box>
              )}
              <Typography variant="h6">{dog.call_name}</Typography>
              <Typography variant="body2">
                {dog.gender} - {dog.status}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ManageDogs;