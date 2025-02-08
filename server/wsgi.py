# server/wsgi.py
from server import create_app

app = create_app()

if __name__ == "__main__":
    # For local development
    app.run(debug=True)
