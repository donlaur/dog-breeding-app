# server/config.py

import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///dev.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
