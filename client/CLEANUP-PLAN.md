# Repository Cleanup Plan

## Current Issues

1. **Scattered Migration Files**:
   - Files in `/database/migrations/`
   - Files in `/migrations/`
   - Files in `/supabase/migrations/`
   - Multiple run-*-migration.sh scripts in root directory

2. **Log Files in Root Directory**:
   - `server.log`
   - `litter_debug.log`
   - `litter_debug_final.log`
   - `server_5001.log`
   - `server_5002.log`

3. **Scripts Scattered Throughout Repository**:
   - Docker scripts in root
   - Restart scripts in root
   - Migration scripts in root
   - Existing `/scripts` directory not fully utilized

4. **Redundant Directories**:
   - Both `/src` and `/server` directories
   - Multiple database-related directories

## Cleanup Actions

### 1. Consolidate Database Migrations

- [ ] Create a unified `/database` structure:
  ```
  /database
  ├── migrations/      # All database migrations
  ├── scripts/         # Migration scripts
  └── README.md        # Documentation on database structure & migrations
  ```
- [ ] Move all migration files from:
  - [ ] `/migrations/` → `/database/migrations/`
  - [ ] `/supabase/migrations/` → `/database/migrations/supabase/`
- [ ] Move migration scripts from root to `/database/scripts/`:
  - [ ] `run-documents-migration.sh`
  - [ ] `run-events-migration.sh`
  - [ ] `run-photos-migration.sh`
  - [ ] `run-photos-rls-fix.sh`
  - [ ] `run-sql.sh`
  - [ ] `run_migrations.py`

### 2. Organize Script Files

- [ ] Consolidate all scripts into `/scripts` directory:
  ```
  /scripts
  ├── deploy/          # Deployment scripts
  ├── docker/          # Docker-related scripts
  ├── migrations/      # Migration runner scripts
  └── utils/           # Utility scripts
  ```
- [ ] Move Docker scripts to `/scripts/docker/`:
  - [ ] `docker-start.sh`
- [ ] Move restart scripts to `/scripts/utils/`:
  - [ ] `restart-all.sh`
  - [ ] `restart-client.sh`
  - [ ] `restart-server.sh`
- [ ] Create `/scripts/README.md` with script documentation

### 3. Handle Log Files

- [ ] Create a `/logs` directory (if it doesn't already exist)
- [ ] Verify no sensitive information in log files
- [ ] If logs don't contain sensitive info:
  - [ ] Move to `/logs` directory
- [ ] If logs contain sensitive info:
  - [ ] Delete from repository
  - [ ] Add to `.gitignore`
- [ ] Add `/logs/*.log` to `.gitignore` to prevent future logs from being committed

### 4. Organize Configuration Files

- [ ] Create a `/config` directory
- [ ] Move configuration templates to `/config`:
  - [ ] `email-config-template.env`
  - [ ] `logging.config.example.js`
- [ ] Create a `/docker` directory for Docker-related files
- [ ] Move Docker files to `/docker`:
  - [ ] `Dockerfile` (root)
  - [ ] `docker-compose.yml`
  - [ ] `docker-compose.dev.yml`

### 5. Clean Up Root Directory

- [ ] Ensure only essential files remain in root:
  - [ ] `README.md`
  - [ ] `.env.example`
  - [ ] `requirements.txt`
  - [ ] Essential app entry points

### 6. Update Documentation

- [ ] Update main `README.md` with new directory structure
- [ ] Create specific READMEs for each major directory
- [ ] Document migration process
- [ ] Document script usage

### 7. Update Import Paths & References

- [ ] Check and update import paths in Python files
- [ ] Update references in scripts
- [ ] Ensure Docker volumes & paths are updated

## Testing Plan

After completing the reorganization:

1. Verify Docker builds and runs correctly
2. Run key scripts to ensure they work with new paths
3. Run tests to ensure application functionality
4. Verify migrations can be executed

## Implementation Strategy

1. Create a branch for cleanup (done: `cleanup/repository-organization`)
2. Make changes systematically, commit after each logical group
3. Test thoroughly
4. Create PR to merge back to main
5. Get code review