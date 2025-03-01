# Breeder Management System

A comprehensive solution for dog breeders to manage their breeding program, track litters, puppies, and related activities.

## Project Overview

This application helps breeders track dogs, litters, puppies, health records, and customer interactions. It includes both a management dashboard for breeders and a public-facing website for potential puppy buyers.

## API Endpoints

**Authentication** (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and receive token
- `POST /api/auth/register` — Register new user
- `GET /api/auth/user` — Get current user info

**Dogs** (`/api/dogs`)
- `GET /api/dogs` — Retrieve all dogs
- `GET /api/dogs/<id>` — Retrieve a specific dog
- `POST /api/dogs` — Create a new dog
- `PUT /api/dogs/<id>` — Update an existing dog
- `DELETE /api/dogs/<id>` — Delete a dog
- `POST /api/dogs/<id>/photos` — Upload photo for a dog

**Puppies** (`/api/puppies`)
- `GET /api/puppies` — Retrieve all puppies
- `GET /api/puppies/<id>` — Retrieve a specific puppy
- `POST /api/puppies` — Create a new puppy
- `PUT /api/puppies/<id>` — Update an existing puppy
- `DELETE /api/puppies/<id>` — Delete a puppy
- `POST /api/puppies/<id>/photos` — Upload photo for a puppy

**Breeding Program** (`/api/breeder-program`)
- `GET /api/breeder-program` — Retrieve breeding program details

**Litters** (`/api/litters`)
- `GET /api/litters` — Retrieve all litters
- `GET /api/litters/<id>` — Retrieve a litter with its associated puppies
- `POST /api/litters` — Create a new litter
- `PUT /api/litters/<id>` — Update an existing litter
- `DELETE /api/litters/<id>` — Delete a litter
- `POST /api/litters/<id>/puppies` — Add a new puppy to a litter

**Heat Cycles** (`/api/heat-cycles`)
- `GET /api/heat-cycles` — Retrieve all heat cycle records
- `POST /api/heat-cycles` — Create a new heat cycle
- `PUT /api/heat-cycles/<id>` — Update an existing heat cycle
- `DELETE /api/heat-cycles/<id>` — Delete a heat cycle

## Technical Architecture

### Backend (Python/Flask)

- **Flask Application**: Structured using blueprints for organizing API endpoints
- **Database Layer**: Uses abstraction pattern with Supabase implementation
- **Authentication**: JWT-based auth with secure password handling
- **File Storage**: Integrated with Supabase storage
- **Blueprint Registration**: All endpoints are organized in blueprints and registered in `server/api/__init__.py`

### Frontend (React)

- **React Application**: Component-based architecture with hooks
- **State Management**: Context-based approach (DogContext, LitterContext, AuthContext, etc.)
- **UI Framework**: Material UI components with custom styling
- **Routing**: React Router with protected routes
- **API Communication**: Centralized in `src/utils/apiUtils.js` handling CORS, auth, and errors

## Design Decisions

- **Supabase Integration**: We use Supabase for both database and file storage, offloading storage and using a managed PostgreSQL instance.
- **Data Normalization**: Numeric fields are normalized (empty strings → `null`) to prevent DB errors.
- **File Uploads**: Files are first saved to a temp file, then uploaded to Supabase Storage.
- **Modular Architecture**: Endpoints are separated into blueprints (dogs, litters, heat cycles, etc.) for easier maintenance.
- **Frontend Flexibility**: The React front end uses context for data (e.g., dogs, breeds) and shared components like `LitterForm` and `DogForm`.
- **Error Handling**: Basic error handling is implemented, with potential for static JSON caching as fallback if the DB is unavailable.
- **Material UI Integration**: Consistent use of Material UI components for better UX and mobile responsiveness
- **Loading States**: Implemented proper loading states to prevent data flashing and improve user experience
- **Mobile-First Design**: All new features are designed with mobile users in mind
- **API Utilities**: All frontend API calls MUST use the utilities in `src/utils/apiUtils.js` to ensure proper CORS handling

## Key Implementation Details

### Database Abstraction
The database layer is abstracted through an interface defined in `server/database/interface.py` with implementation in `server/database/supabase_db.py`. This allows for swapping database implementations without changing business logic.

### API Utilities
Frontend API calls should always use the utilities from `src/utils/apiUtils.js`:
- `apiGet(endpoint, options)` - For GET requests
- `apiPost(endpoint, data, options)` - For POST requests
- `apiPut(endpoint, data, options)` - For PUT requests
- `apiDelete(endpoint, options)` - For DELETE requests

These handle authentication headers, CORS requirements, and consistent error handling.

### Context System
The application uses React Context for state management:
- `DogContext` - Manages dog data and operations
- `LitterContext` - Manages litter data and operations
- `AuthContext` - Manages authentication state
- `HeatContext` - Manages heat cycle data

## Common Pitfalls to Avoid

1. **Direct fetch calls**: Always use apiUtils instead of direct fetch to avoid CORS issues
2. **Forgetting API pattern**: New endpoints must follow the blueprint pattern
3. **Bypassing DB abstraction**: All database operations must use the abstraction layer
4. **Duplicating state**: Use the context system for shared state
5. **Missing auth checks**: Ensure protected routes have proper authentication
6. **Inconsistent file handling**: Use the standard file upload utilities

## Future Enhancements

- **Salesforce Integration**: Explore using Salesforce forms for advanced CRM capabilities.
- **Enhanced Heat Cycle Tracking**: Implement notifications for upcoming heat cycles and expected whelp dates.
- **User Authentication**: Add role-based authentication for breeders vs. general users.
- **Analytics Dashboard**: Provide breeding performance metrics and heat cycle analytics.
- **Improved Error Handling**: Possibly serve static JSON as a fallback if the database is down.

## Setup Instructions

### Environment Variables

Create a `.env` file in the root directory with the following variables:

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ADMIN_EMAILS=admin@example.com,another.admin@example.com

The `ADMIN_EMAILS` variable is a comma-separated list of email addresses that will be granted admin privileges when they sign up.

### Database Setup

The application will automatically create required tables on the first run. However, if you need to manually set up the database:

1. Connect to your Supabase database
2. Run the following SQL queries:

sql
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
name VARCHAR(255),
password_hash VARCHAR(255) NOT NULL,
role VARCHAR(50) DEFAULT 'user',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert an admin user (Replace with your information)
INSERT INTO users (email, name, password_hash, role)
VALUES ('your.email@example.com', 'Admin User', 'your_password', 'admin');


AI Helper - Context Updates if the AI gets confused while building
# Breeder App Context Helper

## File Structure
- Frontend: client/src/* (React)
- Backend: server/* (Python Flask)

## Frontend Components
- No .jsx extension used, all files are .js
- Main pages in client/src/pages/*
- Dogs, Puppies, and Litters managed through DogContext

## Data Structure
- DogContext manages: dogs, litters, breeds, and heatCycles
- Puppies are dogs with is_adult=false

## API Structure
- All API calls go through client/src/utils/apiUtils.js
- Backend endpoints: /api/dogs/, /api/puppies/, /api/litters/, etc.

## Naming Conventions
- Frontend: camelCase for variables and functions
- Backend: snake_case for database fields and API parameters
- DB mappings: birthdate → birth_date, weight_birth → weight_at_birth