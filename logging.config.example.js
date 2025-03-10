/**
 * Example Logging Configuration
 * 
 * This is a template for configuring logging in the dog breeding application.
 * Copy this file to logging.config.js and adjust settings as needed.
 * NOTE: logging.config.js is gitignored and should never be committed.
 */

module.exports = {
  // General logging configuration
  general: {
    // Directory where logs will be stored
    logDirectory: './logs',
    
    // Log levels: error, warn, info, http, verbose, debug, silly
    logLevel: 'info',
    
    // Maximum log file size in bytes before rotation (10MB default)
    maxSize: 10 * 1024 * 1024,
    
    // Maximum number of log files to keep
    maxFiles: 5,
    
    // Whether to sanitize personal information
    sanitizePersonalInfo: true,
    
    // Regular expressions for personal information to sanitize
    // (replace these with appropriate patterns for your data)
    sanitizePatterns: [
      // Example: Sanitize email addresses
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
      // Example: Sanitize potential usernames or personal identifiers
      { pattern: /donlaur|username/gi, replacement: '[USER]' }
    ]
  },
  
  // Backend API logging
  api: {
    // Whether to log API requests
    logRequests: true,
    
    // Whether to log API responses
    logResponses: true,
    
    // API-specific log file
    logFile: 'api.log',
    
    // Fields to exclude from request/response logging for privacy
    excludeFields: ['password', 'token', 'secret', 'key', 'credit_card']
  },
  
  // Database query logging
  database: {
    // Whether to log database queries
    logQueries: false,
    
    // Whether to log database query results
    logResults: false,
    
    // Database-specific log file
    logFile: 'database.log'
  },
  
  // Client-side logging
  client: {
    // Whether to enable client-side logging
    enabled: true,
    
    // Log level for client-side logs
    logLevel: 'warn',
    
    // Client-specific log file (for server-received client logs)
    logFile: 'client.log'
  }
};
