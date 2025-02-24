// src/pages/litters/ManageLitters.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Fab,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const ManageLitters = () => {
  const navigate = useNavigate();
  const [litters, setLitters] = useState([]);
  const [dogsMap, setDogsMap] = useState({}); // Maps dog.id -> dog object
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Fetch litters
    fetch(`${API_URL}/litters/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Litters data received:", data);
        setLitters(data);
      })
      .catch((err) => {
        debugError("Error fetching litters:", err);
        debugError("Error details:", err.message);
      });

    // Fetch dogs for litter details
    fetch(`${API_URL}/dogs/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((dogsData) => {
        debugLog("Dogs data for litters received:", dogsData);
        const map = {};
        dogsData.forEach((dog) => {
          map[dog.id] = dog;
        });
        setDogsMap(map);
      })
      .catch((err) => {
        debugError("Error fetching dogs for litters:", err);
        debugError("Error details:", err.message);
      });
  }, []);

  // Format date as mm/dd/yyyy
  const formatDate = (isoDateString) => {
    if (!isoDateString) return "";
    const dateObj = new Date(isoDateString);
    return dateObj.toLocaleDateString("en-US");
  };

  return (
    <Box sx={{ p: 2, pb: { xs: 10, sm: 2 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1">
          Litters
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {litters.map((litter) => {
          const sireDog = dogsMap[litter.sire_id];
          const damDog = dogsMap[litter.dam_id];

          return (
            <Grid item xs={12} sm={6} md={4} key={litter.id}>
              <Card 
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/dashboard/litters/${litter.id}`)}
              >
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {litter.litter_name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Chip 
                      label={litter.status || "Active"} 
                      color="primary" 
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Birthdate:</strong> {formatDate(litter.birth_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Sire:</strong> {sireDog ? sireDog.registered_name : "None"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Dam:</strong> {damDog ? damDog.registered_name : "None"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Price:</strong> ${litter.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Deposit:</strong> ${litter.deposit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Puppies:</strong> {litter.num_puppies}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
          onClick={() => navigate("/dashboard/litters/add")}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Desktop Add Button */}
      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Fab
            variant="extended"
            color="primary"
            onClick={() => navigate("/dashboard/litters/add")}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Litter
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default ManageLitters;
