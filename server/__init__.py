import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    # Load environment variables from .env if present
    load_dotenv()

    app = Flask(__name__, static_folder='../client/build', static_url_path='/')

    # Set secret key from environment variable or fallback
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

    # Configure database URI (swap out SQLite for Postgres/MySQL in production)
    db_uri = os.getenv('DATABASE_URI', 'sqlite:///dev.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)  # Enable CORS if client is on a different domain/port

    # Register routes
    from server.routes import main_bp
    app.register_blueprint(main_bp)

    return app
