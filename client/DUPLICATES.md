# Duplicate Files in Codebase

This document lists files that appear to be duplicates in the codebase. For each set, we've indicated which version is actively being used based on imports in App.js and other key files.

## Page Files
- DogDetails.js
  - MAIN: `src/pages/DogDetails.js` (imported in App.js, line 32)
  - Duplicate: `src/pages/dogs/DogDetails.js` (not imported in App.js)

- PuppyDetails.js
  - MAIN: `src/pages/puppies/PuppyDetails.js` (imported in App.js, line 28)
  - Duplicate: `src/PuppyDetails.js` (not imported in App.js)

- AddPuppy.js
  - MAIN: `src/pages/puppies/AddPuppy.js` (imported in App.js, line 24)
  - Duplicate: `src/pages/litters/AddPuppy.js` (not directly imported in App.js)

- ManageHeats.js
  - MAIN: `src/pages/heats/ManageHeats.js` (imported in App.js, line 25)
  - Duplicate: `src/pages/ManageHeats.js` (not imported in App.js)

- DashboardLayout.js
  - MAIN: `src/components/layout/DashboardLayout.js` (imported in App.js, line 10)
  - Duplicate: `src/pages/DashboardLayout.js` (not imported in App.js)

## Layout Components
- Header.js
  - MAIN: `src/components/layout/Header.js` (imported by DashboardLayout.js)
  - Duplicate: `src/components/Header.js`

- Footer.js
  - MAIN: `src/components/layout/Footer.js` (imported by DashboardLayout.js)
  - Duplicate: `src/components/Footer.js`

- Sidebar.js
  - MAIN: `src/components/layout/Sidebar.js` (imported by DashboardLayout.js)
  - Duplicate: `src/components/Sidebar.js`

## Shared Components
- Modal.js/Modal.css
  - MAIN: `src/components/shared/Modal.js` and `src/components/shared/Modal.css`
  - Duplicate: `src/components/Modal.js` and `src/components/Modal.css`

- ProtectedRoute.js
  - MAIN: `src/components/ProtectedRoute.js` (imported in App.js, line 11)
  - Duplicate: `src/components/shared/ProtectedRoute.js` (not imported in App.js)

## Dashboard Components
- StatCards.js
  - MAIN: `src/components/overview/StatCards.js` (imported by Overview.js)
  - Duplicate: `src/components/dashboard/StatCards.js` (appears to be unused)

- AdultDogsList.js
  - MAIN: `src/components/overview/AdultDogsList.js` (imported by Overview.js)
  - Duplicate: `src/components/dashboard/AdultDogsList.js` (appears to be unused)

- PuppiesList.js
  - MAIN: `src/components/overview/PuppiesList.js` (imported by Overview.js)
  - Duplicate: `src/components/dashboard/PuppiesList.js` (appears to be unused)

- LittersList.js
  - MAIN: `src/components/overview/LittersList.js` (imported by Overview.js)
  - Duplicate: `src/components/dashboard/LittersList.js` (appears to be unused)

## Heat Components
- HeatForm.js
  - MAIN: `src/components/heats/HeatForm.js` (imported by AddHeat.js)
  - Duplicate: `src/components/HeatForm.js` (appears to be unused)

- HeatList.js
  - MAIN: `src/components/heats/HeatList.js` (imported by ManageHeats.js)
  - Duplicate: `src/components/HeatList.js` (appears to be unused)

- HeatCalendar.js/HeatCalendar.css
  - MAIN: `src/components/heats/HeatCalendar.js` (imported in App.js, line 29)
  - Duplicate: `src/components/HeatCalendar.js` and `src/components/HeatCalendar.css` (appears to be unused)

## Other Components
- DogForm.js
  - MAIN: `src/pages/dogs/DogForm.js` (imported in App.js, line 19)
  - Duplicate: `src/components/DogForm.js` (appears to be unused)

- UpcomingEvents.js
  - MAIN: `src/components/overview/UpcomingEvents.js` (imported by Overview.js)
  - Duplicate: `src/components/UpcomingEvents.js` (appears to be unused)

## Utilities
- Image/Photo Utils
  - Compare: `src/utils/imageUtils.js` 
  - Compare: `src/utils/photoUtils.js`
  (Need to analyze usage to determine which is primary)

## Recommended Approach

To safely eliminate duplicates:

1. **Check imports**: Use search to find all imports of the duplicate files
2. **Verify functionality**: Ensure the main version has all the functionality of the duplicate
3. **Update imports**: Update any imports to point to the main version
4. **Test thoroughly**: Test the application after each change
5. **Move to backup**: Don't delete - move files to a backup folder first

Consider using a deprecation strategy where you add comments at the top of duplicate files indicating they're deprecated and directing developers to the main versions.