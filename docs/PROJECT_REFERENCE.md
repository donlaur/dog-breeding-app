# Dog Breeding App Project Reference

## IMPORTANT: ALWAYS CHECK THIS DOCUMENT FIRST

This document serves as the primary reference for the Dog Breeding App project. It contains critical information about the project architecture, technologies, and implementation patterns.

## Key Technology Decisions

1. **Database**: Supabase (PostgreSQL-based)
   - We DO NOT use SQLAlchemy or any other ORM
   - All database access is through the Supabase client API
   - See [Database Architecture](./architecture/database.md) for details

2. **Backend**: Flask
   - Organized into blueprints
   - JWT-based authentication
   - RESTful API design
   - See [Backend API Architecture](./architecture/backend_api.md) for details

3. **Frontend**: React
   - Context-based state management
   - React Router for navigation
   - Material UI for components
   - See [Frontend Architecture](./architecture/frontend.md) for details

## Development Workflow

1. Check this reference document first
2. Review relevant architecture documents
3. Implement changes following established patterns
4. Test changes thoroughly

## Common Gotchas

1. **Database Access**: Always use Supabase client, never attempt to use SQLAlchemy or other ORMs
2. **Model Pattern**: All models use static methods and return data directly from Supabase
3. **API Responses**: Supabase responses are in the format `response.data`
4. **Authentication**: All protected endpoints use the `@login_required` decorator

## Project Structure

```
dog-breeding-app/
├── client/             # React frontend
├── server/             # Flask backend
│   ├── models/         # Data models (Supabase interfaces)
│   ├── routes/         # Additional route modules
│   ├── utils/          # Utility functions
│   └── *.py            # Blueprint modules
├── database/           # Database migrations and scripts
├── supabase/           # Supabase configuration
└── docs/               # Project documentation
    ├── architecture/   # Detailed architecture docs
    └── PROJECT_REFERENCE.md  # This file
```

## Quick Reference

### Supabase Model Pattern

```python
class ModelName:
    @staticmethod
    def get_all():
        response = supabase.table("table_name").select("*").execute()
        return response.data
        
    @staticmethod
    def create(data):
        response = supabase.table("table_name").insert(data).execute()
        return response.data[0] if response.data else None
```

### API Endpoint Pattern

```python
@blueprint.route('/endpoint', methods=['GET'])
@login_required
def endpoint():
    try:
        # Implementation
        return jsonify(result), 200
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
```

### React Context Pattern

```javascript
const SomeContext = createContext();

export const SomeProvider = ({ children }) => {
  const [data, setData] = useState([]);
  
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/endpoint`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  return (
    <SomeContext.Provider value={{ data, fetchData }}>
      {children}
    </SomeContext.Provider>
  );
};

export const useSomeContext = () => useContext(SomeContext);
```
