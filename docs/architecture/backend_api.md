# Dog Breeding App Backend API Architecture

## Overview

The Dog Breeding App backend is built with Flask and uses Supabase for data storage. This document outlines the API structure, endpoints, and implementation patterns.

## Technology Stack

- **Framework**: Flask
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based authentication
- **API Style**: RESTful

## API Structure

The API is organized into blueprints, each handling a specific domain of functionality:

```python
# Example blueprint registration in app.py
blueprints = [
    (create_dogs_bp(db), '/api/dogs'),
    (create_litters_bp(db), '/api/litters'),
    (breeds_bp, '/api/breeds'),
    (create_heats_bp(db), '/api/heats'),
    (create_auth_bp(db), '/api/auth'),
    (create_program_bp(db), '/api/program'),
    (create_puppies_bp(db), '/api/puppies'),
    (create_photos_bp(db), '/api/photos'),
    (create_files_bp(db), '/api/files'),
    (create_events_bp(db), '/api/events'),
    (create_search_bp(db), '/api/search'),
    (create_customers_bp(db), '/api/customers'),
    (applications_bp, ''),  # Uses its own URL prefix
    (create_health_bp(), '/api/health'),
    (leads_bp, '/api/leads'),
    (messages_bp, '/api/messages'),
    (notifications_bp, ''),  # Uses its own URL prefix
]
```

## Blueprint Implementation Pattern

Blueprints are typically created using factory functions:

```python
def create_blueprint_name(db):
    blueprint_name = Blueprint('name', __name__)
    
    @blueprint_name.route('/endpoint', methods=['GET'])
    @login_required
    def get_items():
        # Implementation
        pass
        
    return blueprint_name
```

## Authentication

The API uses JWT-based authentication with the `@login_required` decorator:

```python
@blueprint.route('/protected-endpoint', methods=['GET'])
@login_required
def protected_endpoint():
    user_id = g.user_id  # User ID is stored in Flask's g object
    # Implementation
    pass
```

## Error Handling

API endpoints use try-except blocks for error handling:

```python
@blueprint.route('/endpoint', methods=['GET'])
@login_required
def endpoint():
    try:
        # Implementation
        return jsonify(result), 200
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
```

## API Endpoints

### Authentication

- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/refresh`: Refresh an authentication token
- `GET /api/auth/user`: Get the current user's profile

### Dogs

- `GET /api/dogs`: Get all dogs
- `GET /api/dogs/<id>`: Get a specific dog
- `POST /api/dogs`: Create a new dog
- `PUT /api/dogs/<id>`: Update a dog
- `DELETE /api/dogs/<id>`: Delete a dog

### Litters

- `GET /api/litters`: Get all litters
- `GET /api/litters/<id>`: Get litter by ID
- `POST /api/litters`: Create a new litter
- `PUT /api/litters/<id>`: Update a litter
- `DELETE /api/litters/<id>`: Delete a litter

### Puppies

- `GET /api/puppies`: Get all puppies
- `GET /api/puppies/<id>`: Get puppy by ID
- `POST /api/puppies`: Create a new puppy
- `PUT /api/puppies/<id>`: Update a puppy
- `DELETE /api/puppies/<id>`: Delete a puppy

### Health

- `GET /api/health/records`: Get all health records
- `POST /api/health/records`: Create a new health record
- `GET /api/health/vaccinations`: Get all vaccinations
- `POST /api/health/vaccinations`: Create a new vaccination

### Notifications

- `GET /api/notifications`: Get all notifications for the current user
- `POST /api/notifications`: Create a new notification
- `PUT /api/notifications/<id>`: Update a notification (mark as read)
- `DELETE /api/notifications/<id>`: Delete a notification
- `DELETE /api/notifications`: Delete all notifications for the current user
- `PUT /api/notifications/read-all`: Mark all notifications as read

### Customer Management

#### Customers

- `GET /api/customers`: Get all customers
- `GET /api/customers?lead_status=X&lead_source=Y`: Filter customers by lead status/source
- `GET /api/customers/recent_leads`: Get recently added leads
- `GET /api/customers/<id>`: Get a specific customer
- `POST /api/customers`: Create a new customer
- `PUT /api/customers/<id>`: Update a customer
- `DELETE /api/customers/<id>`: Delete a customer

#### Customer Communications

- `GET /api/customers/<id>/communications`: Get all communications for a customer
- `POST /api/customers/<id>/communications`: Add a new communication for a customer
- `GET /api/communications`: Get all communications
- `GET /api/communications?type=X`: Filter communications by type
- `GET /api/communications/upcoming`: Get upcoming follow-ups
- `PUT /api/communications/<id>`: Update a communication
- `DELETE /api/communications/<id>`: Delete a communication

#### Customer Contracts

- `GET /api/customers/<id>/contracts`: Get all contracts for a customer
- `POST /api/customers/<id>/contracts`: Create a new contract for a customer
- `GET /api/contracts`: Get all contracts
- `GET /api/contracts?status=X`: Filter contracts by status
- `GET /api/contracts/<id>`: Get a specific contract
- `PUT /api/contracts/<id>`: Update a contract
- `POST /api/contracts/<id>/send`: Send a contract to the customer
- `DELETE /api/contracts/<id>`: Delete a contract

#### Leads

- `GET /api/leads`: Get all leads
- `GET /api/leads?status=X`: Filter leads by status
- `POST /api/leads`: Create a new lead
- `PUT /api/leads/<id>`: Update a lead
- `PUT /api/leads/<id>/status`: Update a lead's status
- `POST /api/leads/<id>/convert`: Convert a lead to a customer
- `DELETE /api/leads/<id>`: Delete a lead

### Events
- `GET /api/events`: Get all events
- `GET /api/events/<id>`: Get event by ID
- `POST /api/events`: Create a new event
- `PUT /api/events/<id>`: Update an event
- `DELETE /api/events/<id>`: Delete an event
