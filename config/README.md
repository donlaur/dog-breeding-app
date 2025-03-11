# Configuration

This directory contains configuration templates and examples for the Breeder Management System.

## Configuration Files

- **email-config-template.env** - Template for email service configuration
- **logging.config.example.js** - Example configuration for application logging

## Environment Variables

The application uses several environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ADMIN_EMAILS=admin@example.com,another.admin@example.com

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dog_breeding_app

# Application Settings
FLASK_DEBUG=true
REACT_APP_DEBUG_MODE=true
```

## Client Environment Variables

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

## Email Configuration

To set up email functionality, copy `email-config-template.env` to `.email.env` and fill in your email service details:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=noreply@yourapp.com
```