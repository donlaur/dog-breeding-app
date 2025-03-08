"""
response_utils.py

Utility functions for standardized API responses.
"""

from flask import jsonify, make_response
from .config import debug_log

def make_json_response(data=None, status=200, error=None, message=None):
    """
    Creates a standardized JSON response with proper CORS headers.
    
    Args:
        data: The data to include in the response (Optional)
        status: HTTP status code (Default: 200)
        error: Error message if applicable (Optional)
        message: Success/info message if applicable (Optional)
        
    Returns:
        Flask response object with JSON data and CORS headers
    """
    # For direct data responses (backward compatibility)
    if data is not None and not isinstance(data, dict):
        response = make_response(jsonify(data))
        response.status_code = status
    else:
        # Standard response format
        response_data = {}
        
        # Add status indicator
        response_data['success'] = 200 <= status < 300
        
        # Add data if provided
        if data is not None:
            if isinstance(data, dict):
                response_data['data'] = data
            else:
                response_data['data'] = data
        
        # Add error if provided
        if error is not None:
            response_data['error'] = error
        
        # Add message if provided
        if message is not None:
            response_data['message'] = message
        
        # Create response
        response = make_response(jsonify(response_data))
        response.status_code = status
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
    return response

def error_response(message, status=400, error_details=None):
    """
    Creates a standardized error response.
    
    Args:
        message: Main error message
        status: HTTP status code (Default: 400)
        error_details: Additional error details (Optional)
        
    Returns:
        Flask response object with error details
    """
    debug_log(f"API Error ({status}): {message}")
    
    response_data = {
        'success': False,
        'error': message
    }
    
    if error_details:
        response_data['error_details'] = error_details
    
    response = make_response(jsonify(response_data))
    response.status_code = status
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
    return response

def success_response(data=None, message=None, status=200):
    """
    Creates a standardized success response.
    
    Args:
        data: The data to include in the response (Optional)
        message: Success message (Optional)
        status: HTTP status code (Default: 200)
        
    Returns:
        Flask response object with success details
    """
    return make_json_response(data=data, message=message, status=status) 