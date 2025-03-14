# Dog Breeding App - Supabase Cloud Connection

This guide explains how to run your Dog Breeding App locally while connecting to your Supabase cloud database.

## Overview

Since we encountered Docker credential issues, this alternative setup allows you to:

1. Run your Flask backend directly on your local machine
2. Connect to your Supabase cloud database
3. Run your React frontend locally
4. Maintain all your established database patterns and best practices

## Prerequisites

- Python 3.10+ installed
- Node.js and npm installed
- Supabase account with a project set up
- Your `.env` file with Supabase credentials

## Running the Application

We've created a simple script to help you run the application with Supabase:

```bash
# Navigate to the project root
cd /Users/donlaur/Documents/GitHub/breeder-tools/dog-breeding-app

# Make the script executable (if not already)
chmod +x run-with-supabase.sh

# Run the script
./run-with-supabase.sh
```

The script will:
1. Load your Supabase credentials from the `.env` file
2. Start the Flask backend server
3. Open a new terminal and start the React frontend
4. Ensure proper database connections and patterns are used

## Database Access Patterns

The application will maintain your established database patterns:

1. For retrieving multiple records with filters:
   - Using `find_by_field_values(table, filters)` method
   - Example: `db.find_by_field_values("dogs", {"litter_id": litter_id})`

2. For retrieving a single record by ID:
   - Using `get(table, id)` method
   - Example: `db.get("litters", litter_id)`

3. Proper separation between "puppies" and "dogs" tables:
   - "puppies" table for young dogs in a litter
   - "dogs" table for adult breeding dogs (dams and sires)

4. Handling non-existent database fields:
   - The server adds fields like `dam_info`, `sire_info`, `breed_info` to responses
   - These are removed before sending data back to the server

## Accessing the Application

Once running, you can access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Troubleshooting

### Backend Issues

If the backend fails to start:
1. Check your Supabase credentials in the `.env` file
2. Ensure you have all required Python packages installed
3. Check the terminal output for specific error messages

### Frontend Issues

If the frontend fails to start:
1. Make sure Node.js and npm are installed
2. Run `npm install` in the client directory to install dependencies
3. Check that the backend API is running and accessible

### Database Connection Issues

If you encounter database connection issues:
1. Verify your Supabase URL and key are correct
2. Check that your Supabase project is running
3. Ensure your IP address is allowed in Supabase's security settings
