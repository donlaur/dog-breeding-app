"""
Root-level app.py for the Dog Breeding App.

This file is placed at the root of the repository (above the server folder)
and serves as the entry point for running the application. It imports the
create_app function from the server module and runs the app. Environment variables
are loaded automatically via the server's configuration.
"""

from server import create_app

if __name__ == "__main__":
    app = create_app()
    
    # Print all registered routes before running
    print("\n=== Registered routes: ===")
    rules = list(app.url_map.iter_rules())
    rules.sort(key=lambda x: x.rule)
    for rule in rules:
        print(f"  {rule.methods} {rule.rule} -> {rule.endpoint}")
    
    print("\n=== Starting server... ===")
    app.run(debug=True, port=5000)
