# Code Review Guide for Dog Breeding App

This guide outlines the process and best practices for conducting code reviews in the Dog Breeding App project. Following these guidelines helps maintain code quality, prevent regression bugs, and ensure consistent implementation of our database and API patterns.

## Code Review Process

1. **Automated Checks**: All PRs will automatically trigger GitHub Actions workflows that run tests, linting, and specific checks for database query patterns and API contracts.

2. **Manual Review**: At least one team member should review the code changes, using the checklist in the PR template as a guide.

3. **Approval**: PRs require approval from at least one reviewer before merging.

4. **Merge**: After approval and passing all automated checks, the PR can be merged.

## What to Look For in Code Reviews

### Database Query Pattern

The Dog Breeding App follows a specific pattern for database queries:

1. For retrieving multiple records with filters:
   - MUST use `find_by_field_values(table, filters)` method, NOT `find(table, filters)`
   - Example: `db.find_by_field_values("dogs", {"litter_id": litter_id})`

2. For retrieving a single record by ID:
   - MUST use `get(table, id)` method
   - Example: `db.get("litters", litter_id)`

3. Error handling pattern:
   - Always check if the record exists before proceeding
   - Return appropriate HTTP status codes (404 for not found, 500 for server errors)
   - Include CORS headers in the response

4. Puppies vs Dogs separation:
   - The "puppies" table stores information about young dogs that are part of a litter
   - The "dogs" table is used for adult breeding dogs (dams and sires)
   - When querying for puppies associated with a litter, always use:
     ```python
     db.find_by_field_values("puppies", {"litter_id": litter_id})
     ```
     NOT:
     ```python
     db.find_by_field_values("dogs", {"litter_id": litter_id})
     ```

### API Contracts

1. Response Structure:
   - All API responses should follow a consistent structure
   - Success responses should include the requested data and a 2xx status code
   - Error responses should include an error message and appropriate status code

2. Field Names:
   - Field names should be consistent across all endpoints
   - Follow camelCase for JSON response fields
   - Follow snake_case for database and internal variable names

3. Documentation:
   - New endpoints should be documented in the API documentation
   - Changes to existing endpoints should be reflected in the documentation

### Code Quality

1. Readability:
   - Code should be easy to understand
   - Variable and function names should be descriptive
   - Complex logic should be commented

2. Maintainability:
   - Code should be modular and follow DRY (Don't Repeat Yourself) principles
   - Functions should have a single responsibility
   - Large functions should be broken down into smaller, more manageable pieces

3. Performance:
   - Database queries should be efficient
   - Avoid N+1 query problems
   - Consider pagination for endpoints that return large datasets

4. Security:
   - Validate all user inputs
   - Use parameterized queries to prevent SQL injection
   - Ensure authenticated endpoints are properly protected
   - Don't expose sensitive information in responses

### Test Coverage

1. Unit Tests:
   - New functionality should have corresponding unit tests
   - Modified functionality should have updated tests
   - Tests should verify both success and error cases

2. Integration Tests:
   - Critical workflows should have integration tests
   - Tests should verify that components work together correctly

3. API Contract Tests:
   - Tests should verify that API response structures remain consistent

4. Database Pattern Tests:
   - Tests should verify that the correct database query pattern is used

## Common Issues to Watch For

1. **Incorrect Database Query Pattern**:
   - Using `find` instead of `find_by_field_values`
   - Not using `get` for retrieving a single record by ID
   - Querying the wrong table (e.g., "dogs" instead of "puppies")

2. **Inconsistent Error Handling**:
   - Not checking if a record exists before proceeding
   - Returning incorrect status codes
   - Not including proper error messages

3. **Breaking API Contracts**:
   - Changing the structure of existing API responses
   - Removing fields from responses
   - Changing field types

4. **Missing Tests**:
   - Not adding tests for new functionality
   - Not updating tests for modified functionality
   - Not testing error cases

5. **Security Issues**:
   - Not validating user inputs
   - Exposing sensitive information
   - Not properly protecting authenticated endpoints

## Review Comments

When providing feedback in code reviews:

1. Be specific and clear about what needs to be changed
2. Explain why the change is needed
3. Provide examples or suggestions when possible
4. Be constructive and respectful
5. Focus on the code, not the person

Example of a good review comment:
> "This endpoint is using `find` instead of `find_by_field_values` for retrieving puppies. We should use `find_by_field_values` to follow our database query pattern and ensure consistency across the codebase. Here's an example: `db.find_by_field_values('puppies', {'litter_id': litter_id})`"

## Final Checklist Before Approving

- [ ] All automated checks pass
- [ ] The code follows our database query pattern
- [ ] API contracts are maintained
- [ ] Test coverage is adequate
- [ ] No security issues are present
- [ ] Documentation is updated
- [ ] The code is readable and maintainable
