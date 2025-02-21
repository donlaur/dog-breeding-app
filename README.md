# Dog Breeding App

Welcome to the Dog Breeding App – a web application designed to help breeders manage dogs, litters, puppies, and track heat cycles. This project uses a Flask backend with Supabase as its database and storage provider, and a React front end for an intuitive dashboard.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Design Decisions](#design-decisions)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Overview

The Dog Breeding App provides breeders with tools to:
- Manage adult dogs and litters.
- Add, edit, and delete dog and litter records.
- Upload and preview cover photos for dogs and litters.
- Track heat cycles of adult females (new feature).
- Manage inquiries and messages.
- (Future) Integrate with Salesforce for advanced CRM features.

## Features

- **Dogs Management**: View, add, edit, and delete dog records.
- **Litters Management**: Manage litters including details such as litter name, birth dates, and associated puppies.
- **Puppy Management**: Add puppies to litters.
- **Heat Cycle Tracking**: *(New)* Track heat cycles for female dogs. Log start/end dates, mating dates, and whelp dates.
- **Responsive Dashboard**: A breeder dashboard with a sidebar for navigating profile, dogs, litters, and heat cycles.
- **File Uploads**: Cover photos are uploaded to Supabase Storage with preview capabilities.
- **Error Handling**: Basic error handling on the backend to manage database connectivity and other issues.
- **Extensible Design**: The system is built to allow future integration with CRM systems and other breeder tools.

## Installation

1. **Clone the repository**  
   - `git clone https://github.com/donlaur/dog-breeding-app.git`  
   - `cd dog-breeding-app`

2. **Install backend dependencies**  
   - `cd server`  
   - `pip install -r requirements.txt`

3. **Install frontend dependencies**  
   - `cd ../client`  
   - `npm install`

4. **Run the backend**  
   - `flask run`

5. **Run the frontend**  
   - `npm start`

## Configuration

Create a `.env` file in the **backend** directory with:

SUPABASE_URL=https://your-project.supabase.co SUPABASE_KEY=your-supabase-key

For the **frontend**, you might have a `.env` file with:

REACT_APP_API_URL=http://127.0.0.1:5000/api REACT_APP_DEFAULT_BREED_ID=123


## API Endpoints

**Dogs** (`/api/dogs`)
- `GET /api/dogs` — Retrieve all dogs
- `GET /api/dogs/<id>` — Retrieve a single dog by ID
- `POST /api/dogs` — Create or update a dog record
- `DELETE /api/dogs/<id>` — Delete a dog

**Breeds** (`/api/breeds`)
- `GET /api/breeds` — Retrieve all dog breeds
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

## Design Decisions

- **Supabase Integration**: We use Supabase for both database and file storage, offloading storage and using a managed PostgreSQL instance.
- **Data Normalization**: Numeric fields are normalized (empty strings → `null`) to prevent DB errors.
- **File Uploads**: Files are first saved to a temp file, then uploaded to Supabase Storage.
- **Modular Architecture**: Endpoints are separated into blueprints (dogs, litters, heat cycles, etc.) for easier maintenance.
- **Frontend Flexibility**: The React front end uses context for data (e.g., dogs, breeds) and shared components like `LitterForm` and `DogForm`.
- **Error Handling**: Basic error handling is implemented, with potential for static JSON caching as fallback if the DB is unavailable.

## Future Enhancements

- **Salesforce Integration**: Explore using Salesforce forms for advanced CRM capabilities.
- **Enhanced Heat Cycle Tracking**: Implement notifications for upcoming heat cycles and expected whelp dates.
- **User Authentication**: Add role-based authentication for breeders vs. general users.
- **Analytics Dashboard**: Provide breeding performance metrics and heat cycle analytics.
- **Improved Error Handling**: Possibly serve static JSON as a fallback if the database is down.

## License

This project is licensed under the [MIT License](LICENSE).

For more details, visit the [GitHub repository](https://github.com/donlaur/dog-breeding-app).
