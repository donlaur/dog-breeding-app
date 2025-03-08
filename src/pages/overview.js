import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DogCard from '../components/DogCard';
import { API_URL } from '../config';

const Dashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dogs`);
      setDogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setLoading(false);
    }
  };

  // Define the missing refreshDogs function
  const refreshDogs = () => {
    fetchDogs();
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const navigateToAddDog = () => {
    navigate('/add-dog');
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Dog Breeding Dashboard</h1>
          <p>Manage your breeding program efficiently</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={navigateToAddDog}>
            Add New Dog
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Dogs Overview</Card.Title>
              <Card.Text>
                Total dogs: {dogs.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {loading ? (
          <Col>Loading...</Col>
        ) : dogs.length === 0 ? (
          <Col>No dogs found. Add some dogs to get started.</Col>
        ) : (
          dogs.map((dog) => (
            <Col key={dog.id} md={4} className="mb-4">
              <DogCard 
                dog={dog} 
                refreshDogs={refreshDogs} 
              />
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default Dashboard; 