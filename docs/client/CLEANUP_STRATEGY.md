# Cleanup Strategy for Duplicate Files

This document outlines a safe, incremental approach to cleaning up duplicate files in the codebase.

## Preparation

1. **Create a backup branch**: Before making any changes, create a new git branch
   ```
   git checkout -b cleanup-duplicates
   ```

2. **Create a backup directory**: 
   ```
   mkdir -p .backup-unused-files
   ```

## Cleanup Process

For each set of duplicate files, follow these steps:

1. **Check for usages**:
   ```
   grep -r "import.*FileName" src/
   ```

2. **If the duplicate file is imported anywhere**:
   - Modify all importing files to use the main version instead
   - Test thoroughly after each change
   - Commit changes: `git commit -m "Update imports to use primary version of FileName"`

3. **If the duplicate file is not imported anywhere**:
   - Move to backup: `git mv src/path/to/duplicate.js .backup-unused-files/`
   - Commit: `git commit -m "Move unused duplicate of duplicate.js to backup"`

## Specific Cleanup Tasks (in recommended order)

### 1. Clear Unused Page Components

1. Move `/src/PuppyDetails.js` to backup (keeping `/src/pages/puppies/PuppyDetails.js`)
2. Move `/src/pages/ManageHeats.js` to backup (keeping `/src/pages/heats/ManageHeats.js`)
3. Move `/src/pages/DashboardLayout.js` to backup (keeping `/src/components/layout/DashboardLayout.js`)
4. Move `/src/pages/litters/AddPuppy.js` to backup (keeping `/src/pages/puppies/AddPuppy.js`)

### 2. Clear Unused Layout Components

5. Move `/src/components/Header.js` to backup (keeping `/src/components/layout/Header.js`)
6. Move `/src/components/Footer.js` to backup (keeping `/src/components/layout/Footer.js`)
7. Move `/src/components/Sidebar.js` to backup (keeping `/src/components/layout/Sidebar.js`)

### 3. Clear Unused Dashboard Components

8. Move `/src/components/dashboard/` directory to backup (keeping `/src/components/overview/`)

### 4. Clear Unused Heat Components

9. Move `/src/components/HeatForm.js` to backup (keeping `/src/components/heats/HeatForm.js`)
10. Move `/src/components/HeatList.js` to backup (keeping `/src/components/heats/HeatList.js`)
11. Move `/src/components/HeatCalendar.js` and `/src/components/HeatCalendar.css` to backup 
    (keeping `/src/components/heats/HeatCalendar.js` and `/src/components/heats/HeatCalendar.css`)

### 5. Clear Other Unused Components

12. Move `/src/components/DogForm.js` to backup (keeping `/src/pages/dogs/DogForm.js`)
13. Move `/src/components/UpcomingEvents.js` to backup (keeping `/src/components/overview/UpcomingEvents.js`)

### 6. Fix the Modal and ProtectedRoute Situation

Before moving:
- Check current imports for both versions
- Compare the two implementations to ensure they have the same functionality

14. Update `App.js` to import ProtectedRoute from `/src/components/shared/ProtectedRoute.js`  
    (App.js currently imports from `/src/components/ProtectedRoute.js`)
15. After testing, move `/src/components/ProtectedRoute.js` to backup
16. Move `/src/components/Modal.js` and `/src/components/Modal.css` to backup 
    (keeping `/src/components/shared/Modal.js` and `/src/components/shared/Modal.css`)

### 7. Compare and Decide on Utility Files

17. Compare `/src/utils/imageUtils.js` and `/src/utils/photoUtils.js`
18. Determine which one has more usages and functionality
19. Update any imports to use the preferred version
20. Move the unused version to backup

### 8. Special Handling for DogDetails.js

Since both versions might be in active use:
1. Compare the code in both files
2. Consolidate any unique functionality into the main version (`/src/pages/DogDetails.js`)
3. Update any imports to use the main version
4. Move the duplicate to backup

## Testing

After each change:

1. **Run the application**: `npm start`
2. **Test affected functionality**
3. **Run any unit tests**: `npm test`

## Finalization

After all cleanup:

1. **Create a PR**: Push branch and create PR for review
2. **Document changes**: List all files moved and their original locations
3. **Keep backup**: Don't delete `.backup-unused-files` immediately after merging

## Rollback Plan

If anything breaks:
1. Restore from backup: `git mv .backup-unused-files/filename.js src/path/to/original/location/`
2. Or revert to main branch

## Future Prevention

To prevent accumulation of duplicate files:
1. **Consistent naming**: Use clear, consistent naming patterns
2. **Logical organization**: Follow a clear organizational structure 
3. **Documentation**: Document the project structure and naming conventions
4. **Linting**: Consider linting rules to detect duplicate exports