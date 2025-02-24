from flask import Flask
from flask_cors import CORS
from .config import debug_log, SUPABASE_URL, SUPABASE_KEY
from .database.supabase_db import SupabaseDatabase

def get_db():
    debug_log("Initializing database connection...")
    return SupabaseDatabase(SUPABASE_URL, SUPABASE_KEY)

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app)
    
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
    
    debug_log("Registering blueprints...")
    app.register_blueprint(create_dogs_bp(db), url_prefix="/api/dogs")
    app.register_blueprint(create_litters_bp(db), url_prefix="/api/litters")
    app.register_blueprint(create_program_bp(db), url_prefix="/api/program")
    app.register_blueprint(create_heats_bp(db), url_prefix="/api/heats")
    app.register_blueprint(create_messages_bp(db), url_prefix="/api")
    
    debug_log("Application initialization complete")
    return app