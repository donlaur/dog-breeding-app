from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register the main blueprint
    from server.routes import main_bp
    app.register_blueprint(main_bp)

    # If you have additional blueprints (e.g., a dashboard), register them here:
    # from server.dashboard import dashboard_bp
    # app.register_blueprint(dashboard_bp, url_prefix="/dashboard")

    return app
