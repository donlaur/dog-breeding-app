from flask import Flask
from flask_cors import CORS
from .config import debug_log, SUPABASE_URL, SUPABASE_KEY
from .database.supabase_db import SupabaseDatabase
from dotenv import load_dotenv

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
    from flask import Blueprint, request, jsonify
    
    # Create auth blueprint directly in __init__.py
    auth_bp = Blueprint("auth_bp", __name__)
    
    @auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
    def auth_signup():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        # Handle actual request
        data = request.get_json()
        return jsonify({
            'message': 'Signup endpoint hit!',
            'data': data,
            'token': 'test-token',
            'user': {
                'id': 1,
                'email': data.get('email', ''),
                'name': data.get('name', '')
            }
        }), 201
    
    @auth_bp.route('/login', methods=['POST', 'OPTIONS'])
    def auth_login():
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return '', 200
        # Handle actual request
        data = request.get_json()
        return jsonify({
            'message': 'Login endpoint hit!',
            'token': 'test-token',
            'user': {
                'id': 1,
                'email': data.get('email', '')
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
        
        # For testing, just accept any token and return success
        token = auth_header.split(' ')[1]
        return jsonify({
            'message': 'Token verified',
            'user': {
                'id': 1,
                'email': 'user@example.com',
                'name': 'Test User'
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
    
    debug_log("Application initialization complete")
    return app