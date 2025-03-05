# Content Management System (CMS) for Dog Breeding App

This document outlines the implementation of a CMS feature for the Dog Breeding App. This feature allows breeders to create, manage, and display content pages on their website.

## Features

- Create, edit, and delete custom web pages
- WYSIWYG editor for user-friendly content editing
- Template selection for different page layouts
- SEO optimization with customizable metadata
- Slug-based URLs for clean page addresses
- Draft/published status control

## Implementation Steps

### 1. Database Setup

Run the database migration to create the pages table:

```bash
cd /path/to/dog-breeding-app
flask db upgrade
```

This will create the following table structure:
- `id`: Primary key
- `title`: Page title
- `slug`: URL slug (unique)
- `content`: HTML content
- `template`: Template name (default, about, contact, etc.)
- `status`: Publication status (published or draft)
- `meta_description`: SEO description
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### 2. Frontend Dependencies

The CMS uses React Quill as the WYSIWYG editor. Install it with:

```bash
cd /path/to/dog-breeding-app/client
npm install react-quill --force
```

**Note:** The `--force` flag is needed due to React 19 compatibility issues.

### 3. Using the CMS

#### Creating Pages

1. Log in to the breeder dashboard
2. Navigate to "Manage Pages" in the sidebar
3. Click "Add New Page"
4. Fill in the page details:
   - Title
   - Content (using the WYSIWYG editor)
   - Template
   - Status (published or draft)
   - SEO description
5. Click "Create Page"

#### Editing Pages

1. Go to "Manage Pages"
2. Find the page you want to edit
3. Click the edit icon
4. Make your changes
5. Click "Update Page"

#### Public Access

Public pages are available at:
- `/page/{slug}`

For example, if you create a page with slug "about-us", it will be accessible at `/page/about-us`.

### 4. Customizing Templates

The CMS includes several template options:
- Default
- About Us
- Contact Page
- Our Dogs
- Available Puppies
- FAQ

To customize the templates, edit the files in:
`/client/src/components/templates/`

### 5. Recommended Pages

For a complete breeder website, we recommend creating the following pages:
- About Us: Share your breeding program's story and philosophy
- Our Dogs: Showcase your breeding dogs with photos and information
- Available Puppies: Display current and upcoming litters
- FAQ: Answer common questions about your breeding program
- Contact: Provide contact information for interested buyers

## Technical Details

### Backend Structure

- `models.py`: Contains the Page model with database operations
- `pages.py`: API endpoints for CRUD operations
- Migration file: Database schema creation

### Frontend Structure

- `context/PageContext.js`: State management for pages
- `pages/pages/ManagePages.js`: Admin view to list and manage pages
- `pages/pages/PageForm.js`: Form for creating and editing pages
- `pages/pages/PagePreview.js`: Admin preview of pages
- `pages/PublicPage.js`: Public-facing page component
- `components/RichTextEditor.js`: WYSIWYG editor component
- `components/templates/`: Page layout templates

## Security Considerations

- Pages API endpoints are protected with JWT authentication
- Only users with ADMIN or BREEDER roles can create/edit pages
- Draft pages are only visible to logged-in breeders
- HTML content is sanitized to prevent XSS attacks

## Future Enhancements

- Media library for image management
- More page templates
- Page versioning and history
- User comments and feedback forms
- Social sharing integration
- Analytics integration