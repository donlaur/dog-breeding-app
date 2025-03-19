# CRM Implementation Plan for Dog Breeding App

This document outlines the remaining steps needed to fully implement the Customer Relationship Management (CRM) functionality in the dog breeding application.

## Current Status

- Frontend components have been created for customer management
- Basic API routes have been implemented for customer data
- LocalStorage fallback has been implemented for offline/development use
- Database models and tables are partially set up in Supabase
- Flask backend routes for CRM exist but need environment variables for database connection

## Next Steps

### 1. Supabase Database Setup

- [ ] Verify the `customers` table exists in Supabase with the correct schema
- [ ] Ensure the following tables exist with appropriate schemas:
  - `customers` (base customer information)
  - `customer_communications` (communication history)
  - `customer_contracts` (contracts and agreements)
- [ ] Run any pending migrations or SQL scripts needed for CRM functionality
- [ ] Verify that RLS (Row Level Security) policies are properly configured

### 2. Environment Variables

- [ ] Ensure the Flask backend has access to these environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- [ ] Create a `.env` file in the project root or server directory with these values
- [ ] Add environment variables to deployment configuration if needed

### 3. Flask Backend Fixes

- [ ] Fix the `system_health.py` import issue (should use `SupabaseDatabase()` directly instead of importing `db`)
- [ ] Fix the `models/__init__.py` to properly import the `Page` model
- [ ] Ensure the Flask server can start and connect to Supabase without errors
- [ ] Test all `/api/customers/*` endpoints with Postman or curl to verify functionality

### 4. Frontend API Integration

- [ ] Update `config.js` to set the correct API_URL pointing to the Flask backend
- [ ] Verify that the localStorage fallback code in `customerApiUtils.js` works correctly
- [ ] Fix any routing issues between `/customers/*` and `/dashboard/customers/*` paths
- [ ] Implement proper error handling for API failures

### 5. Implement Missing Features

- [ ] Complete the `CustomerCommunications.js` component with real data integration
- [ ] Implement the `CustomerContracts.js` component with real data integration
- [ ] Add UI for managing customer status changes
- [ ] Implement filtering and sorting for the customer list
- [ ] Add reporting capabilities for customer pipeline metrics

### 6. Testing

- [ ] Test customer creation flow end-to-end
- [ ] Test loading and displaying customer data
- [ ] Test creating, updating, and deleting customer communications
- [ ] Test creating and managing contracts
- [ ] Verify that all CRM-related views render correctly with real data

### 7. Performance and Optimization

- [ ] Add loading states for all async operations
- [ ] Implement pagination for large customer datasets
- [ ] Add caching for frequently accessed customer data
- [ ] Optimize database queries for customer retrieval operations

## Dog Breeding-Specific CRM Features to Implement

- [ ] Link customers to specific puppies or adult dogs
- [ ] Create waitlist functionality for litters
- [ ] Implement breeding program application workflows
- [ ] Add health record sharing with customers
- [ ] Create customer portal access for puppy/dog owners

## Resources

- Database schema documentation: `/docs/SCHEMA.md`
- API patterns: `/docs/architecture/api_patterns.md`
- Frontend components directory: `/client/src/pages/Customers/`
- Backend API routes: `/server/customers.py`

## Commands

To start the Flask backend server:
```
cd /Users/donlaur/Documents/GitHub/breeder-tools/dog-breeding-app && python server/app.py --debug
```

To check for processes using port 5000:
```
lsof -i :5000
```

To kill processes using port 5000:
```
kill -9 <PID> <PID>
```