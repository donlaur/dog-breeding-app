"""
Root-level app.py for the Dog Breeding App.

This file is placed at the root of the repository (above the server folder)
and serves as the entry point for running the application. It imports the
create_app function from the server module and runs the app. Environment variables
are loaded automatically via the server's configuration.
"""

from server import create_app

app = create_app()

if __name__ == "__main__":
    # You can set debug=True for development purposes.
    app.run(debug=True)
