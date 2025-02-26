"""
app.py

Simple entrypoint that creates the Flask app using the factory in __init__.py
"""

from server import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
