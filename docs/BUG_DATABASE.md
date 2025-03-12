# Bug Database

This document tracks historical bugs and regression issues in the Dog Breeding App to prevent similar issues from recurring in the future.

## Database Query Pattern Violations

### BUG-001: Using `find()` Instead of `find_by_field_values()`

**Date Identified:** 2025-03-12  
**Severity:** High  
**Status:** Fixed  

**Description:**  
API endpoints were using `db.find()` instead of the required `db.find_by_field_values()` method for retrieving multiple records.

**Root Cause:**  
Lack of clear documentation and enforcement of database query patterns.

**Fix:**  
- Replace all instances of `db.find()` with `db.find_by_field_values()`
- Add automated checks to prevent this issue in the future

**Prevention Measures:**
- Added pre-commit hook to catch this issue before code is committed
- Added continuous integration checks to catch this issue in pushed code
- Added specific tests in `test_db_patterns.py` to verify correct query patterns
- Updated documentation to clearly specify the required pattern

---

### BUG-002: Querying "dogs" Table Instead of "puppies" Table for Litter-Related Queries

**Date Identified:** 2025-03-12  
**Severity:** High  
**Status:** Fixed  

**Description:**  
The litter-puppies endpoint was incorrectly querying the "dogs" table with a litter_id filter instead of the "puppies" table.

**Root Cause:**  
Confusion about the data model and lack of clear documentation on the separation between puppies and dogs.

**Fix:**  
- Change queries from `db.find_by_field_values("dogs", {"litter_id": litter_id})` to `db.find_by_field_values("puppies", {"litter_id": litter_id})`

**Prevention Measures:**
- Added specific checks in the pre-commit hook to catch this issue
- Added tests in `test_db_patterns.py` to verify correct table usage
- Updated documentation to clearly explain the separation between puppies and dogs
- Added comments in the code to clarify the correct table to use

---

### BUG-003: Missing Error Handling After Database Queries

**Date Identified:** 2025-03-12  
**Severity:** Medium  
**Status:** Fixed  

**Description:**  
API endpoints were not properly checking if records exist after `db.get()` calls, potentially returning null values to the client instead of appropriate 404 errors.

**Root Cause:**  
Inconsistent error handling patterns and lack of enforcement.

**Fix:**  
- Add proper error handling after all `db.get()` calls:
  ```python
  record = db.get("table", id)
  if not record:
      return create_response({"error": "Record not found"}, 404)
  ```

**Prevention Measures:**
- Added warnings in the pre-commit hook to catch missing error handling
- Added tests in `test_db_patterns.py` to verify proper error handling
- Updated documentation with clear examples of proper error handling
- Added code review checklist items specifically for error handling

---

## Template for New Bugs

### BUG-XXX: [Bug Title]

**Date Identified:** YYYY-MM-DD  
**Severity:** [High/Medium/Low]  
**Status:** [Identified/In Progress/Fixed/Closed]  

**Description:**  
[Detailed description of the bug]

**Root Cause:**  
[Analysis of what caused the bug]

**Fix:**  
[Description of how the bug was fixed]

**Prevention Measures:**  
[Steps taken to prevent similar bugs in the future]
