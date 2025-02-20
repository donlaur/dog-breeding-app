Updated README.md
markdown
Copy
# Dog Breeding App

This project is a web application for managing dog records within a breeding program. The application is built with a Flask backend and a React frontend, with Supabase as the database and storage provider.

## Project Structure

- **client/**: Contains the React frontend code.
- **server/**: Contains the Flask backend code.
  - **app.py**: Application factory that creates the Flask app and registers blueprints.
  - **dogs.py**: Blueprint for dog-related endpoints (CRUD, file uploads, etc.).
  - **breeds.py**: (Optional) Blueprint for breed-related endpoints.
  - **supabase_client.py**: Supabase client initialization.
- **.env**: Environment variables for Supabase credentials.
- **README.md**: Project documentation.

## Key Features

- **CRUD Operations**: Create, read, update, and delete dog records.
- **File Uploads**: Upload cover photos to Supabase Storage with unique filenames.
- **Modular Architecture**: Uses Flask Blueprints and an application factory to separate functionality.
- **Graceful Error Handling**: 
  - Numeric fields are parsed silently (empty or invalid input becomes `NULL`).
  - API responses are handled using `.dict()` to extract errors and data.
- **Extensible**: The modular structure makes it easy to add new features (e.g., pedigree charts, authentication).

## Modular Flask Structure

The Flask backend is divided into multiple blueprints for easier maintenance and debugging:

- **app.py**: Application factory that creates the Flask app and registers blueprints.
- **dogs.py**: Contains endpoints related to dog records (CRUD operations, file uploads, etc.).
- **breeds.py**: Contains endpoints for retrieving breed information, breeding program details, and litter records.

This modular structure allows developers and AI tools to isolate changes and track regressions more effectively.

## Design Decisions

- **Silent Numeric Parsing**:
  Helper functions convert empty strings or invalid numeric inputs to `None` to prevent database errors.
  
- **File Uploads**:
  Files are saved temporarily and uploaded with a unique filename (using UUID) to avoid collisions.
  
- **Modularization**:
  The application is divided into separate blueprints (e.g., dogs, breeds) to improve maintainability, facilitate testing, and ease future development.
  
- **Documentation & Comments**:
  Code includes detailed docstrings and inline comments explaining each section and design choice.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/dog-breeding-app.git
   cd dog-breeding-app
Set Up the Server:

Create a virtual environment:
bash
Copy
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Install dependencies:
bash
Copy
pip install -r requirements.txt
Create a .env file with your Supabase credentials:
env
Copy
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
Run the Flask server:
bash
Copy
flask run
Set Up the Client:

Navigate to the client directory and install dependencies:
bash
Copy
cd client
npm install
npm start
Future Enhancements
User Authentication and Role-Based Access.
Advanced Search, Filtering, and Sorting.
Pedigree Chart Generation using libraries like Graphviz or NetworkX.
CI/CD Integration for automated testing and deployment.
Contributing
Contributions are welcome. Please follow the coding standards and document your changes. Open pull requests for improvements or bug fixes.

License
This project is licensed under the MIT License.