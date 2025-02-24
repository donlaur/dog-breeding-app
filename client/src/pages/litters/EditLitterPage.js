// src/pages/litters/EditLitterPage.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import {
  Container,
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Alert
} from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LitterForm from "./LitterForm";
import DogContext from "../../context/DogContext";

const EditLitterPage = () => {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { dogs, breeds } = useContext(DogContext);
  const [litter, setLitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  useEffect(() => {
    debugLog("Fetching litter data for editing:", litterId);
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Litter data received:", data);
        setLitter(data);
        setLoading(false);
      })
      .catch((error) => {
        debugError("Error fetching litter:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [litterId]);

  const handleSave = (updatedLitter) => {
    debugLog("Updating litter:", updatedLitter);
    const payload = { ...updatedLitter };
    delete payload.cover_photo_file;
    delete payload.cover_photo_preview;

    fetch(`${API_URL}/litters/${litterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        debugLog("Updated litter:", data);
        navigate(`/dashboard/litters/${litterId}`);
      })
      .catch((error) => {
        debugError("Error updating litter:", error);
        setError(error.message);
      });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!litter) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Could not load litter details.</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link 
            to="/dashboard/litters"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Litters
          </Link>
          <Typography color="text.primary">Edit Litter</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 4 }}>
          Edit Litter: {litter.litter_name}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <LitterForm
            onSave={handleSave}
            initialData={litter}
            breedOptions={breeds}
            sireOptions={sireOptions}
            damOptions={damOptions}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default EditLitterPage;
