import os
from dotenv import load_dotenv

load_dotenv()

DEBUG_MODE = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def debug_log(*args):
    if DEBUG_MODE:
        print(*args)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_options = {
    'development': DevelopmentConfig,
    'production': ProductionConfig
}
