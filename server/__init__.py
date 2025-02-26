from flask import Flask
from flask_cors import CORS
from .config import debug_log, SUPABASE_URL, SUPABASE_KEY
from .database.supabase_db import SupabaseDatabase
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify

def get_db():
    debug_log("Initializing database connection...")
    return SupabaseDatabase(SUPABASE_URL, SUPABASE_KEY)

def create_app(test_config=None):
    load_dotenv()
    app = Flask(__name__)
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins for testing
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    debug_log("Initializing Flask application...")
    
    if test_config is not None:
        app.config.update(test_config)
    
    db = get_db()
    
    # Register blueprints
    from .dogs import create_dogs_bp
    from .litters import create_litters_bp
    from .program import create_program_bp
    from .heats import create_heats_bp
    from .messages import create_messages_bp
    from .breeds import breeds_bp
    # Import auth blueprint
    
    # Create auth blueprint directly in __init__.py
    auth_bp = Blueprint("auth_bp", __name__)
    
    # Read admin emails from environment variable
    def get_admin_emails():
        from os import environ
        admin_emails_str = environ.get('ADMIN_EMAILS', '')
        return [email.strip() for email in admin_emails_str.split(',') if email.strip()]
    
    @auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
    def auth_signup():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        # Handle actual request
        data = request.get_json()
        email = data.get('email', '')
        name = data.get('name', '')
        password = data.get('password', '')
        
        # Determine role based on email
        admin_emails = get_admin_emails()
        role = 'admin' if email in admin_emails else 'user'
        
        # Check if user already exists
        user_exists_query = "SELECT id FROM users WHERE email = %s"
        result = db.execute_query(user_exists_query, (email,))
        
        if result and len(result) > 0:
            return jsonify({"error": "User with this email already exists"}), 400
        
        # Insert new user
        insert_query = """
        INSERT INTO users (email, name, password_hash, role) 
        VALUES (%s, %s, %s, %s) 
        RETURNING id, email, name, role
        """
        
        # In a real app, hash the password before storing
        # For now, we're storing it as plain text (not secure!)
        result = db.execute_query(insert_query, (email, name, password, role))
        
        if not result or len(result) == 0:
            return jsonify({"error": "Failed to create user"}), 500
        
        user = result[0]
        
        return jsonify({
            'message': 'User created successfully',
            'token': 'test-token',
            'user': {
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'role': user[3]
            }
        }), 201
    
    @auth_bp.route('/login', methods=['POST', 'OPTIONS'])
    def auth_login():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        # Handle actual request
        data = request.get_json()
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Find user by email
        query = "SELECT id, email, name, role, password_hash FROM users WHERE email = %s"
        result = db.execute_query(query, (email,))
        
        if not result or len(result) == 0:
            return jsonify({"error": "Invalid credentials"}), 401
        
        user = result[0]
        
        # In a real app, verify the password hash
        # For now, we're doing a plain text comparison (not secure!)
        if user[4] != password:
            return jsonify({"error": "Invalid credentials"}), 401
        
        return jsonify({
            'message': 'Login successful',
            'token': 'test-token',
            'user': {
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'role': user[3]
            }
        }), 200
    
    @auth_bp.route('/verify', methods=['GET', 'OPTIONS'])
    def auth_verify():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        
        # Handle token verification
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        # For testing, derive the email from the token or headers
        # In a real implementation, you would decode the JWT and extract user info
        email = request.headers.get('X-User-Email', '')
        
        if not email:
            return jsonify({"error": "No user email in token"}), 401
        
        # Find user by email
        query = "SELECT id, email, name, role FROM users WHERE email = %s"
        result = db.execute_query(query, (email,))
        
        if not result or len(result) == 0:
            return jsonify({"error": "User not found"}), 401
        
        user = result[0]
        
        return jsonify({
            'message': 'Token verified',
            'user': {
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'role': user[3]
            }
        }), 200
    
    print("\n=== Registering blueprints... ===")
    
    # Register blueprints with error handling
    try:
        app.register_blueprint(create_dogs_bp(db), url_prefix="/api/dogs")
        print("✓ Registered dogs_bp")
    except Exception as e:
        print(f"✗ Failed to register dogs_bp: {str(e)}")
    
    try:
        print("Attempting to register breeds_bp...")
        if not hasattr(breeds_bp, 'name'):
            print("Warning: breeds_bp doesn't seem to be a valid blueprint")
        app.register_blueprint(breeds_bp, url_prefix="/api/breeds")
        print("✓ Registered breeds_bp")
    except Exception as e:
        print(f"✗ Failed to register breeds_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_litters_bp(db), url_prefix="/api/litters")
        print("✓ Registered litters_bp")
    except Exception as e:
        print(f"✗ Failed to register litters_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_program_bp(db), url_prefix="/api/program")
        print("✓ Registered program_bp")
    except Exception as e:
        print(f"✗ Failed to register program_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_heats_bp(db), url_prefix="/api/heats")
        print("✓ Registered heats_bp")
    except Exception as e:
        print(f"✗ Failed to register heats_bp: {str(e)}")
    
    try:
        app.register_blueprint(create_messages_bp(db), url_prefix="/api")
        print("✓ Registered messages_bp")
    except Exception as e:
        print(f"✗ Failed to register messages_bp: {str(e)}")
    
    try:
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        print("✓ Registered auth_bp")
    except Exception as e:
        print(f"✗ Failed to register auth_bp: {str(e)}")
    
    @app.before_first_request
    def create_tables():
        # Create users table if it doesn't exist
        create_users_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        db.execute_query(create_users_table_query)
        
        # Add other table creation queries as needed
    
    debug_log("Application initialization complete")
    return app