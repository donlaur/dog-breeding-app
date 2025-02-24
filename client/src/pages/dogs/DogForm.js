// src/pages/dogs/DogForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import DogContext from "../../context/DogContext";
import "../../styles/DogForm.css";
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  MenuItem,
  Avatar,
  IconButton,
  Typography,
  Breadcrumbs
} from '@mui/material';
import { PhotoCamera, ArrowBack } from '@mui/icons-material';

const DEFAULT_BREED_ID = process.env.REACT_APP_DEFAULT_BREED_ID || 1;
const BREED_NAME = "Pembroke Welsh Corgi"; // Hardcoded for your specific use

// Helper to normalize numeric fields from the API
const normalizeNumericField = (value) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.toLowerCase() === "null")
  ) {
    return "";
  }
  return value;
};

function DogForm() {
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const editingDog = dogs.find((dog) => dog.id === parseInt(id));
  const [dog, setDog] = useState({
    registered_name: '',
    call_name: '',
    breed_id: DEFAULT_BREED_ID,  // Always set to default
    breed: BREED_NAME,           // Add breed name for display
    gender: 'Female',
    birth_date: '',
    status: 'Active',
    cover_photo: '',
    color: '',
    weight: '',
    microchip: '',
    notes: '',
    sire_id: '',
    dam_id: '',
    litter_id: '', // For adult dogs, remains empty
    cover_photo_file: null,
    cover_photo_preview: null,
    is_adult: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      debugLog("Initializing new dog form");
      setDog({
        registered_name: "",
        call_name: "",
        breed_id: DEFAULT_BREED_ID,
        breed: BREED_NAME,
        gender: "Female",
        birth_date: "",
        status: "Active",
        cover_photo: "",
        color: "",
        weight: "",
        microchip: "",
        notes: "",
        sire_id: "",
        dam_id: "",
        litter_id: "",
        cover_photo_file: null,
        cover_photo_preview: null,
        is_adult: false
      });
      setLoading(false);
      return;
    }

    debugLog("Fetching dog data for editing:", id);
    fetch(`${API_URL}/dogs/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Dog data received for editing:", data);
        setDog(data);
        setLoading(false);
      })
      .catch((err) => {
        debugError("Error fetching dog:", err);
        debugError("Error details:", err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p>Loading dog data...</p>;
  }

  if (!dog) {
    return <p>Dog not found or error loading data.</p>;
  }

  // Optional sire/dam options
  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  const handleChange = (e) => {
    setDog({ ...dog, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDog({
        ...dog,
        cover_photo_file: e.target.files[0],
        cover_photo_preview: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting dog form:", dog);

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/dogs/${id}` : `${API_URL}/dogs/`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dog),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Dog saved successfully:", data);
        if (id) {
          setDogs((prev) => prev.map((d) => (d.id === parseInt(id) ? data : d)));
        } else {
          setDogs((prev) => [...prev, data]);
        }
        navigate("/dashboard/dogs");
      })
      .catch((err) => {
        debugError("Error saving dog:", err);
        debugError("Error details:", err.message);
      });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          to="/dashboard/dogs"
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <ArrowBack sx={{ mr: 0.5, fontSize: 20 }} />
          Back to Dogs
        </Link>
        <Typography color="text.primary">
          {id ? 'Edit Dog' : 'Add Dog'}
        </Typography>
      </Breadcrumbs>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        {/* Photo upload section */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            onChange={handlePhotoChange}
          />
          <label htmlFor="photo-upload">
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={dog.cover_photo_preview || dog.cover_photo}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mb: 1,
                  cursor: 'pointer'
                }}
              />
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper'
                }}
              >
                <PhotoCamera />
              </IconButton>
            </Box>
          </label>
        </Box>

        <TextField
          fullWidth
          label="Registered Name"
          name="registered_name"
          value={dog.registered_name}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Call Name"
          name="call_name"
          value={dog.call_name}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Breed"
          value={BREED_NAME}
          margin="normal"
          disabled
          InputProps={{
            readOnly: true,
          }}
        />

        <FormControl component="fieldset" margin="normal">
          <FormLabel component="legend">Gender</FormLabel>
          <RadioGroup
            row
            name="gender"
            value={dog.gender}
            onChange={handleChange}
          >
            <FormControlLabel value="Male" control={<Radio />} label="Male" />
            <FormControlLabel value="Female" control={<Radio />} label="Female" />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          type="date"
          label="Birth Date"
          name="birth_date"
          value={dog.birth_date}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <FormControl component="fieldset" margin="normal">
          <FormLabel component="legend">Status</FormLabel>
          <RadioGroup
            row
            name="status"
            value={dog.status}
            onChange={handleChange}
          >
            <FormControlLabel value="Active" control={<Radio />} label="Active" />
            <FormControlLabel value="Retired" control={<Radio />} label="Retired" />
            <FormControlLabel value="Upcoming" control={<Radio />} label="Upcoming" />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          label="Sire (Father)"
          name="sire_id"
          value={dog.sire_id}
          onChange={handleChange}
          margin="normal"
        >
          <MenuItem value="">None</MenuItem>
          {sireOptions.map((sire) => (
            <MenuItem key={sire.id} value={sire.id}>{sire.registered_name}</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Dam (Mother)"
          name="dam_id"
          value={dog.dam_id}
          onChange={handleChange}
          margin="normal"
        >
          <MenuItem value="">None</MenuItem>
          {damOptions.map((dam) => (
            <MenuItem key={dam.id} value={dam.id}>{dam.registered_name}</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Color"
          name="color"
          value={dog.color}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Weight (lbs)"
          name="weight"
          value={dog.weight}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Microchip"
          name="microchip"
          value={dog.microchip}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Notes"
          name="notes"
          value={dog.notes}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={4}
        />
        
        <FormControl component="fieldset" margin="normal">
          <FormLabel component="legend">
            <input
              type="checkbox"
              name="is_adult"
              checked={dog.is_adult === true}
              onChange={(e) =>
                setDog({ ...dog, is_adult: e.target.checked })
              }
            />
            Adult (in breeding program)
          </FormLabel>
        </FormControl>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            {id ? "Save Changes" : "Add Dog"}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/dashboard/dogs')}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default DogForm;
