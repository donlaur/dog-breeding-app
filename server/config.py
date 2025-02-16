import os

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
