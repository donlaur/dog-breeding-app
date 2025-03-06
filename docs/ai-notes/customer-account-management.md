# Customer Account Management System

## Overview

This document outlines a comprehensive customer account management system for the dog breeding application, enhancing customer engagement, streamlining communication, and tracking the entire customer journey from prospect to puppy owner.

## Date
March 6, 2025

## Customer Journey Stages

The system tracks customers through the following journey stages:

1. **Prospect**: A registered user browsing available puppies
2. **Lead**: User who has shown interest by messaging or favoriting puppies
3. **Waiting List**: Qualified lead who has been approved for a future puppy
4. **Reserved**: Customer who has selected and reserved a specific puppy
5. **Owner**: Customer who has taken home their puppy

## Feature Requirements

### 1. Customer Registration & Authentication

**User Registration**
- Simple registration form (Name, Email, Phone, Password)
- Email verification for account activation
- Privacy policy and terms acceptance
- Optional profile completion (preferences, living situation, etc.)

**Authentication**
- Email/password login
- Password reset functionality
- Role-based access control (customer vs. admin)
- Session management with secure tokens

**API Endpoints**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/password-reset
GET /api/auth/verify-email/:token
GET /api/auth/me
```

**Database Schema**
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'prospect', -- prospect, lead, waiting, reserved, owner
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### 2. Puppy Favoriting System

**Functionality**
- Heart/favorite button on puppy listings and detail pages
- Toggle favorite status with visual feedback
- Favorites collection in customer dashboard
- Notification options for status changes on favorited puppies

**API Endpoints**
```
POST /api/favorites/toggle/:puppyId
GET /api/favorites
DELETE /api/favorites/:puppyId
```

**Database Schema**
```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  puppy_id INTEGER REFERENCES puppies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, puppy_id)
);
```

### 3. Messaging System

**Customer-to-Breeder Communication**
- Contact forms tied to user account
- Message threads organized by topic/puppy
- Automated responses for common questions
- File/photo attachment capability

**Breeder-to-Customer Communication**
- Dashboard for managing all customer communications
- Templated responses for common inquiries
- Bulk messaging to specific customer segments
- Status tracking (unread, read, responded)

**Notification System**
- Email notifications for new messages
- SMS notifications for urgent updates (optional)
- In-app notification center
- Preference management for notification types

**API Endpoints**
```
POST /api/messages
GET /api/messages
GET /api/messages/:threadId
PUT /api/messages/:messageId/read
```

**Database Schema**
```sql
CREATE TABLE message_threads (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  subject VARCHAR(255),
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'open' -- open, closed
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES message_threads(id),
  sender_type VARCHAR(20) NOT NULL, -- customer, breeder
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Waiting List Management

**Customer Features**
- Application form for waiting list
- Status tracking of application
- Position visibility on waiting list
- Preference specification (gender, color, etc.)

**Admin Features**
- Review and approve/reject applications
- Manage waiting list positions
- Match customers to available puppies
- Automated notifications for matches

**API Endpoints**
```
POST /api/waiting-list/apply
GET /api/waiting-list/status
PUT /api/waiting-list/preferences
```

**Database Schema**
```sql
CREATE TABLE waiting_list (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, matched
  position INTEGER,
  preferred_gender VARCHAR(20),
  preferred_colors TEXT[],
  preferred_timeframe VARCHAR(100),
  notes TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Puppy Reservation System

**Reservation Process**
- Selection of available puppy
- Deposit payment integration
- Contract signing (digital)
- Countdown to pickup date

**Admin Tools**
- Assign puppies to waiting list customers
- Track deposits and payments
- Manage pickup scheduling
- Generate customer documents

**API Endpoints**
```
POST /api/reservations
GET /api/reservations/:id
PUT /api/reservations/:id/status
```

**Database Schema**
```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  puppy_id INTEGER REFERENCES puppies(id),
  status VARCHAR(50) DEFAULT 'reserved', -- reserved, paid, completed, cancelled
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  pickup_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Owner Portal

**Post-Purchase Features**
- Digital puppy records
- Vaccination schedules and reminders
- Training resources
- Photo sharing
- Milestone tracking

**Breeder-Owner Communication**
- Ongoing support messaging
- Health check-in forms
- Community features with other owners
- Special offers for future puppies

**API Endpoints**
```
GET /api/owner-portal/puppy/:puppyId
POST /api/owner-portal/milestones
GET /api/owner-portal/resources
```

**Database Schema**
```sql
CREATE TABLE puppy_owners (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  puppy_id INTEGER REFERENCES puppies(id),
  ownership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE puppy_milestones (
  id SERIAL PRIMARY KEY,
  puppy_id INTEGER REFERENCES puppies(id),
  milestone_type VARCHAR(100),
  milestone_date TIMESTAMP,
  description TEXT,
  photo_url VARCHAR(255),
  created_by INTEGER REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Customer Notes & CRM Features

**Customer Relationship Management**
- Detailed customer profiles
- Interaction history tracking
- Custom tags and segmentation
- Follow-up reminders

**Admin Dashboard**
- Customer status overview
- Communication analytics
- Revenue tracking per customer
- Referral tracking

**API Endpoints**
```
POST /api/customers/:id/notes
GET /api/customers/:id/activity
PUT /api/customers/:id/tags
```

**Database Schema**
```sql
CREATE TABLE customer_notes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  content TEXT NOT NULL,
  created_by INTEGER NOT NULL, -- admin user id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_tags (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, tag)
);

CREATE TABLE customer_activity (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  related_entity_type VARCHAR(50), -- puppy, litter, message, etc.
  related_entity_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## UI Components and Screens

### Customer-Facing UI

1. **Account Dashboard**
   - Profile information
   - Favorited puppies
   - Message center
   - Application status
   - Reserved puppy details (if applicable)

2. **Puppy Listing with Favorites**
   - Heart icon on each puppy card
   - Filter to show only favorited puppies
   - "Interested" button for direct inquiry

3. **Messaging Interface**
   - Thread list view
   - Conversation view with message history
   - Compose message form with attachments
   - Notification badges

4. **Waiting List Application**
   - Multi-step form
   - Preference selection
   - Status indicator
   - Position tracker
   
5. **Reservation Management**
   - Selected puppy details
   - Payment status
   - Contract signing
   - Pickup scheduling

6. **Owner Portal**
   - Puppy profile
   - Health records
   - Training progress
   - Milestone gallery

### Admin UI

1. **Customer Management**
   - List view with status filters
   - Detailed customer profile
   - Activity timeline
   - Notes and tags editor

2. **Communication Center**
   - All message threads
   - Search and filter options
   - Bulk messaging tools
   - Templates management

3. **Waiting List Dashboard**
   - Applicant review interface
   - Drag-and-drop list management
   - Matching tool for puppies and applicants
   - Email notification sender

4. **Reservation Tracker**
   - Reserved puppies overview
   - Payment status tracking
   - Document generation
   - Pickup scheduling

5. **Owner Relationship Management**
   - Current owners list
   - Health check-in tracker
   - Follow-up scheduler
   - Resource sharing

## Implementation Approach

### Phase 1: Core Authentication & Profiles
- Customer registration and login
- Basic profile management
- Admin view of customers
- Simple note-taking capability

### Phase 2: Engagement Features
- Favorites system
- Basic messaging
- Email notifications
- Puppy browsing enhancements

### Phase 3: Lead Processing
- Waiting list application
- Application review interface
- Status tracking
- Customer segmentation

### Phase 4: Transactions
- Reservation system
- Payment integration
- Contract management
- Pickup scheduling

### Phase 5: Ownership Experience
- Owner portal
- Health records
- Milestone tracking
- Community features

## Technical Considerations

### Authentication & Security
- JWT for stateless authentication
- Role-based permissions
- Data encryption for sensitive information
- GDPR compliance for EU customers

### Real-time Features
- WebSockets for messaging
- Push notifications
- Status updates without refresh

### Mobile Responsiveness
- Adaptive design for all screen sizes
- Touch-friendly interactions
- Offline capabilities for key features

### Integration Points
- Payment processor (Stripe/PayPal)
- Email service (SendGrid/Mailgun)
- SMS gateway (Twilio)
- Document signing (DocuSign/HelloSign)

## User Flow Examples

### New Customer Registration & Favoriting
1. User visits website and browses available puppies
2. User clicks "heart" icon on a puppy they like
3. Prompt appears to create an account
4. User completes registration form
5. Email verification sent and confirmed
6. User returns to complete favoriting the puppy
7. System records customer as a "lead"

### Waiting List Application
1. Registered user views available litters
2. User clicks "Join Waiting List"
3. Multi-step application form appears
4. User submits preferences and information
5. Breeder receives notification of new application
6. Breeder approves application
7. User receives confirmation and waiting list position
8. User status changes to "waiting list"

### Puppy Reservation
1. Waiting list customer receives notification of puppy availability
2. Customer views matched puppy details
3. Customer confirms interest and submits deposit
4. Digital contract is sent for signing
5. Customer signs contract
6. Breeder confirms reservation
7. Customer status changes to "reserved"
8. Pickup countdown begins

### Puppy Pickup & Ownership
1. Customer receives pickup reminder notifications
2. Customer completes any remaining payments
3. Pickup appointment is scheduled
4. Puppy goes home with customer
5. Customer account transitions to "owner" status
6. Owner portal is activated
7. Customer begins receiving care reminders and resources
8. Owner can add milestones and photos to puppy timeline

## Benefits

1. **For Customers**
   - Streamlined communication
   - Transparent process tracking
   - Personalized experience
   - Valuable resources and support

2. **For Breeders**
   - Reduced administrative workload
   - Better lead qualification
   - Improved customer relationships
   - Higher conversion rates

3. **For Business**
   - Increased customer retention
   - Enhanced reputation
   - Data-driven breeding decisions
   - Additional revenue opportunities (training, supplies, etc.)

## Next Steps

1. Define user stories and detailed requirements for Phase 1
2. Create wireframes for initial customer-facing components
3. Design database schema for core tables
4. Implement authentication system and basic profile management
5. Develop admin dashboard for customer viewing
6. Test with a small group of actual customers
7. Gather feedback and refine for Phase 2