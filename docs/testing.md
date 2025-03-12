# Dog Breeding App - Testing Documentation

## Overview

This document explains how to run the automated tests for the Dog Breeding App. The test suite includes:

1. **Backend Tests**: Verify that the server API endpoints work correctly, particularly focusing on the critical distinction between the "puppies" and "dogs" tables.

2. **Frontend Tests**: Ensure that components use the correct API utility functions and handle responses properly.

## Backend Tests

The backend tests use pytest and are located in the `server/tests` directory.

### Setup

Install the required dependencies:

```bash
cd server/tests
pip install -r requirements.txt
```

### Running the Tests

From the project root directory:

```bash
# Run all tests
python -m pytest server/tests

# Run with coverage report
python -m pytest server/tests --cov=server

# Run specific test file
python -m pytest server/tests/test_litters.py

# Run specific test
python -m pytest server/tests/test_litters.py::test_get_litter_puppies_correct_table_queried
```

### Key Tests

1. **`test_get_litter_puppies_correct_table_queried`**: Verifies that the endpoint queries the "puppies" table, not the "dogs" table.

2. **`test_get_litter_puppies_success`**: Ensures the endpoint returns the correct puppies for a litter.

3. **`test_get_litter_with_dam_sire_names`**: Checks that dam and sire names are included in litter details.

## Frontend Tests

The frontend tests use Jest and React Testing Library and are located in the `client/src/tests` directory.

### Setup

Install the required dependencies:

```bash
cd client
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Running the Tests

From the client directory:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- LitterDetails.test.js
```

### Key Tests

1. **API Utility Function Usage**: Verifies that components use the dedicated API utility functions from `apiUtils.js` instead of direct fetch calls.

2. **Error Handling**: Tests proper handling of API errors.

3. **Data Display**: Ensures that retrieved data is correctly displayed to the user.

## Continuous Integration

To run tests automatically on each commit, you can set up a CI pipeline using GitHub Actions or another CI service.

A sample GitHub Actions workflow is provided in `.github/workflows/tests.yml`.

## Running All Tests

For convenience, a script is provided to run all tests:

```bash
./run_tests.sh
```

This will run both backend and frontend tests and generate coverage reports.

## Test Coverage Requirements

To maintain code quality, we require:

- Backend: Minimum 80% test coverage
- Frontend: Minimum 70% test coverage

The coverage reports will show which parts of the code need additional tests.
