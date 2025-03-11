# Breeder Management System

A comprehensive solution for dog breeders to manage their breeding program, track litters, puppies, and related activities.

## Project Overview

This application helps breeders track dogs, litters, puppies, health records, and customer interactions. It includes both a management dashboard for breeders and a public-facing website for potential puppy buyers.

## API Endpoints

**Authentication** (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and receive token
- `POST /api/auth/register` — Register new user
- `GET /api/auth/profile` — Get current user profile
- `PUT /api/auth/profile` — Update user profile
- `POST /api/auth/change-password` — Change user password

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

**Events** (`/api/events`)
- `GET /api/events` — Retrieve all events
- `GET /api/events/<id>` — Retrieve a specific event
- `POST /api/events` — Create a new event
- `PUT /api/events/<id>` — Update an existing event
- `DELETE /api/events/<id>` — Delete an event
- `GET /api/events/entity/<entity_type>/<entity_id>` — Get events for a specific entity
- `POST /api/events/generate/litter/<litter_id>` — Generate events for a litter
- `POST /api/events/generate/birthdays` — Generate birthday events for all dogs

**Search** (`/api/search`)
- `GET /api/search` — Search across multiple entity types
  - Query parameters:
    - `q`: Search query
    - `type`: Optional entity filter (dogs, puppies, litters, all)

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
- **Event Generation**: Automatic event generation for litters and birthdays to help breeders track important milestones.
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
- `AuthContext` - Manages authentication state, user profile, and password management
- `HeatContext` - Manages heat cycle data
- `PageContext` - Manages CMS pages
- Calendar events are managed through direct API calls rather than context

## Common Pitfalls to Avoid

1. **Direct fetch calls**: Always use apiUtils instead of direct fetch to avoid CORS issues
2. **Forgetting API pattern**: New endpoints must follow the blueprint pattern
3. **Bypassing DB abstraction**: All database operations must use the abstraction layer
4. **Duplicating state**: Use the context system for shared state
5. **Missing auth checks**: Ensure protected routes have proper authentication
6. **Inconsistent file handling**: Use the standard file upload utilities

## Recent Enhancements

### Search Functionality
The application now features a comprehensive search system that allows users to search across multiple entity types:
- Global search across dogs, puppies, and litters from a single interface
- Categorized results with filtering capabilities
- Rich search results with thumbnails and relevant information
- Direct navigation to entity detail pages from search results
- See [docs/search-functionality.md](docs/search-functionality.md) for details

### User Account Management
A complete user account management system has been implemented, separate from breeder profile:
- User profile management for personal information
- Security settings with password change functionality
- Notification center for system alerts and messages
- System settings for appearance, data, security, and advanced preferences
- See [docs/user-account-management.md](docs/user-account-management.md) for details

## Future Enhancements

- **Salesforce Integration**: Explore using Salesforce forms for advanced CRM capabilities.
- **Enhanced Heat Cycle Tracking**: Implement notifications for upcoming heat cycles and expected whelp dates.
- **Role-based Authentication**: Expand the user system with role-based permissions.
- **Analytics Dashboard**: Provide breeding performance metrics and heat cycle analytics.
- **Improved Error Handling**: Possibly serve static JSON as a fallback if the database is down.
- **Mobile App**: Native mobile application for on-the-go management.

## Calendar Events System

The application includes a comprehensive events system to help breeders track important dates and milestones:

### Automatic Event Generation

- **Litter Milestones**: When a litter is added, events are automatically created for:
  - Birth day
  - Weekly development milestones (1-8 weeks)
  - Important care dates (dewclaw removal, vaccinations)
  - Go-home date (8 weeks after birth)
  - Dam care reminders
  
- **Dog Birthdays**: Annual birthday events for all dogs

### Custom Events

Users can create custom events with:
- Start and end dates
- All-day or timed events
- Color coding
- Association with dogs or litters
- Recurring schedules (daily, weekly, monthly, yearly)
- Notification settings

### Event Rules

The system includes an event rules engine that can:
- Trigger events based on entity changes
- Apply conditions for when rules should execute
- Generate events with customizable properties
- Support multiple action types

## Setup Instructions

### Environment Variables

Create a `.env` file in the root directory with the following variables:

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ADMIN_EMAILS=admin@example.com,another.admin@example.com

The `ADMIN_EMAILS` variable is a comma-separated list of email addresses that will be granted admin privileges when they sign up.

### Client Environment Variables

Create a `.env` file in the client directory with the following variables:

```
# Port Configuration
PORT=3000                          # Client development server port
REACT_APP_API_PORT=5000            # API server port
REACT_APP_API_URL=http://localhost:${REACT_APP_API_PORT}/api

# App Configuration
REACT_APP_DEFAULT_BREED_ID=1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_DEBUG_MODE=true
```

These environment variables configure the ports used by the client and server. 
For more details about port configuration and process management, see [PORT-CONFIG.md](client/PORT-CONFIG.md).

### Running the Application

We've added new scripts to manage port conflicts and process management:

```bash
# Start the development environment (auto-detects and resolves port conflicts)
cd client
npm run dev

# Run tests with isolated ports
npm run test:isolated

# Traditional start method (may have port conflicts)
npm start
```

The `npm run dev` script is recommended for development as it:
1. Checks for processes using the configured ports (3000 for client, 5000 for API by default)
2. Automatically kills any conflicting processes
3. Starts both client and server applications with the correct environment

This is especially useful when working with AI tools that may repeatedly start and stop the application.

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

### Running Migrations

The application includes several database migration scripts in the `docs/migrations/` directory. To run a migration:

```bash
# For the events system migration
./run-events-migration.sh

# After migrating, generate events for existing data
python generate_all_events.py
```


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