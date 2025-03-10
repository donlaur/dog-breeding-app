# Database Migration Plan

## Overview

This document outlines the detailed plan for reorganizing the database schema in the Dog Breeding App. The goal is to establish a more consistent and logically organized database structure while minimizing regression issues. This plan should be implemented on a new branch after verifying that the current implementation is stable.

## Principles for Migration

1. **Incremental Changes**: Implement changes one domain at a time (e.g., health, breeding, etc.)
2. **Zero Downtime**: Each change should allow the application to function correctly
3. **Data Preservation**: No data loss during migration
4. **Comprehensive Testing**: Test each change thoroughly before moving to the next
5. **Rollback Path**: Each step should have a clearly defined rollback procedure

## Detailed Migration Plan

### Phase 1: Preparation (1-2 days)

**Step 1: Create a comprehensive test suite**
- Create automated tests for all major application functionality
- Focus especially on areas that interact with the database
- Document current application behavior for manual verification

**Step 2: Create database backups**
- Full backup of production database
- Create a staging environment with a copy of the production data

**Step 3: Review application code**
- Identify all places in the codebase that interact with database tables
- Document queries and table dependencies
- Create a dependency map between application features and database tables

### Phase 2: Health Management Tables (3-4 days)

Since the Health Management module is already comprehensive with its dashboard for analytics, alerts, and report printing, we'll start with this domain.

**Step 1: Create new tables with the prefix**
```sql
-- Create new health tables with prefixes
CREATE TABLE IF NOT EXISTS public.health_vaccinations (
    -- Copy schema from vaccinations but with the polymorphic relationship
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject_type VARCHAR(20) NOT NULL, -- 'dog' or 'puppy'
    subject_id INTEGER NOT NULL,
    lot_number VARCHAR(100),
    expiration_date DATE,
    administered_by VARCHAR(255),
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Repeat for other health tables...
```

**Step 2: Migrate data to new tables**
```sql
-- Migrate vaccinations data
INSERT INTO public.health_vaccinations (
    id, date, name, subject_type, subject_id, lot_number, 
    expiration_date, administered_by, next_due_date, notes, 
    created_at, updated_at, user_id
)
SELECT 
    id, date, name, 
    CASE 
        WHEN dog_id IS NOT NULL THEN 'dog'
        WHEN puppy_id IS NOT NULL THEN 'puppy'
        ELSE 'unknown'
    END as subject_type,
    COALESCE(dog_id, puppy_id) as subject_id,
    lot_number, expiration_date, administered_by, 
    next_due_date, notes, created_at, updated_at, user_id
FROM public.vaccinations;

-- Repeat for other health tables...
```

**Step 3: Update application code**
- Create new model classes that use the new tables
- Update controller methods to use the new models
- Implement a transition period where both old and new models are supported
- Verify that the Health Dashboard with analytics, alerts, and report printing functionality works correctly

**Step 4: Test thoroughly**
- Verify that the Health Management module works with the new tables
- Test all CRUD operations
- Validate that the Health Analytics charts show correct data
- Confirm that Health Alerts for upcoming vaccinations and medications work
- Test the Health Report Printer functionality

**Step 5: Remove old tables after transition period**
```sql
-- Once confirmed everything works, drop old tables
DROP TABLE IF EXISTS public.vaccinations;
-- Repeat for other old health tables...
```

### Phase 3: Dog & Breeding Management Tables (3-4 days)

**Step 1: Create new tables with the prefix**
```sql
CREATE TABLE IF NOT EXISTS public.breeding_dog_breeds (
    -- Copy schema from dog_breeds
);

CREATE TABLE IF NOT EXISTS public.breeding_dogs (
    -- Copy schema from dogs
);

-- Repeat for other breeding-related tables...
```

**Step 2: Migrate data**
```sql
-- Migrate dog breeds data
INSERT INTO public.breeding_dog_breeds
SELECT * FROM public.dog_breeds;

-- Migrate dogs data
INSERT INTO public.breeding_dogs
SELECT * FROM public.dogs;

-- Repeat for other tables...
```

**Step 3: Update application code**
- Update models, controllers, and views
- Test functionality after each change
- Implement with backward compatibility

**Step 4: Test thoroughly**
- Verify that all dog and breeding management features work correctly
- Test relationship between dogs, litters, and puppies

**Step 5: Remove old tables after transition period**

### Phase 4: Media & Documents Tables (2-3 days)

**Step 1: Create new tables with the prefix**
```sql
CREATE TABLE IF NOT EXISTS public.media_dog_photos (
    -- Copy schema from dog_photos
);

-- Repeat for other media tables...
```

**Step 2: Migrate data**
```sql
-- Migrate dog photos data
INSERT INTO public.media_dog_photos
SELECT * FROM public.dog_photos;

-- Repeat for other tables...
```

**Step 3: Update application code**
- Update models, controllers, and views
- Test functionality after each change

**Step 4: Test thoroughly**
- Verify that all photo and document displays work correctly
- Test upload and retrieval of media files

**Step 5: Remove old tables after transition period**

### Phase 5: Lead Management Tables (2-3 days)

**Step 1: Create new tables with the prefix**
```sql
CREATE TABLE IF NOT EXISTS public.lead_leads (
    -- Copy schema from leads
);

-- Repeat for other lead-related tables...
```

**Step 2: Migrate data**
```sql
-- Migrate leads data
INSERT INTO public.lead_leads
SELECT * FROM public.leads;

-- Repeat for other tables...
```

**Step 3: Update application code**
- Update models, controllers, and views
- Test functionality after each change

**Step 4: Test thoroughly**
- Verify that lead management dashboard shows data correctly
- Test messaging and contact forms

**Step 5: Remove old tables after transition period**

### Phase 6: Remaining Tables (3-4 days)

Repeat the same process for:
- Forms & Applications tables
- Programs & Events tables
- Website tables
- Core tables (customers)

### Phase 7: Final Testing and Documentation (2-3 days)

**Step 1: Comprehensive application testing**
- Test all major application features
- Verify that all data is preserved and accessible
- Check that all relationships between tables work correctly

**Step 2: Performance testing**
- Verify that the application performance is not degraded
- Optimize any slow queries

**Step 3: Documentation**
- Update database schema documentation
- Document any changes to APIs or data access patterns
- Update developer onboarding materials

## Rollback Procedures

For each phase, the rollback procedure is:

1. If new code is deployed:
   - Roll back to the previous version of the code

2. If data is not yet migrated to new tables:
   - Simply drop the new tables

3. If data is already migrated and old tables are dropped:
   - Restore from the backup created at the beginning of the phase
   - Consider point-in-time recovery options if available

## Timeline

The entire migration is estimated to take 15-20 days of development time, plus additional time for testing and deployment:

- **Phase 1: Preparation** - 1-2 days
- **Phase 2: Health Management Tables** - 3-4 days
- **Phase 3: Dog & Breeding Management Tables** - 3-4 days
- **Phase 4: Media & Documents Tables** - 2-3 days
- **Phase 5: Lead Management Tables** - 2-3 days
- **Phase 6: Remaining Tables** - 3-4 days
- **Phase 7: Final Testing and Documentation** - 2-3 days

## Conclusion

This migration plan provides a methodical approach to reorganizing the database schema while minimizing the risk of regression issues. By implementing changes incrementally and thoroughly testing each phase, we can ensure a smooth transition to a more logical and consistent database structure.

The new structure will better align with the application's domain model and make future development more intuitive and maintainable. Particular attention will be paid to maintaining the Health Management module's functionality, including its dashboard with analytics, alerts, and report printing capabilities.
