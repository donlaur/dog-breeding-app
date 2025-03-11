# Additional Repository Cleanup Tasks

This document outlines additional cleanup tasks needed to complete the repository reorganization.

## Issues to Address

1. **Stray Files Outside of Server Directory**:
   - `app.py` - A Flask entry point at the repository root
   - `.flaskenv` - Flask environment configuration at root
   - `test_pages_api.py` - A test file at the repository root
   - `requirements.txt` - Python dependencies at the repository root

2. **Duplicate Directories**:
   - `src` directory at repo root (should be under client)
   - `supabase/migrations` duplicates content in `database/migrations/supabase`

## Cleanup Actions

### 1. Handle Flask Application Files

- [x] Move/copy test file to server directory:
  - `test_pages_api.py` → `server/tests/test_pages_api.py`

- [x] Move Python dependencies:
  - `requirements.txt` → `server/requirements.txt`
  - Keep original in root for compatibility
  
- [ ] Preserve the root app.py:
  - The root app.py serves as the main entry point
  - server/app.py contains the actual implementation
  - Both files are needed in their current locations

- [ ] Move Flask configuration:
  - `.flaskenv` → `server/config/.flaskenv`

### 2. Client-Side Cleanup

- [x] Move stray frontend code:
  - `src/` → `client/archive/src/` (for temporary preservation)
  - Eventually remove after verifying all code is properly migrated to client/src

### 3. Eliminate Duplicate Migrations

- [x] Verify migrations in `database/migrations/supabase` are identical to `supabase/migrations`
- [ ] Remove redundant `supabase` directory after full verification
- [ ] Document in README that all Supabase migrations are now in database/migrations/supabase

### 4. Update Docker Configuration

- [ ] Update Docker Compose files to reference the new file locations:
  - Update `FLASK_APP` environment variable
  - Update context paths if needed
  - Update volume mounts if needed

### 5. Create Launcher Script in Root

- [x] Create a simple launcher script in the root for convenience:
  - `start.sh` that forwards commands to the correct scripts in the scripts directory

## Implementation Notes

- We need to ensure Docker builds still work after these changes
- We should thoroughly test the application launch after reorganization
- Some paths in imports may need to be updated