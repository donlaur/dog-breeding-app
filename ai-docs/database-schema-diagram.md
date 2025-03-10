# Dog Breeding App Database Schema

## Current Database Schema

The current database schema is organized into several functional areas:

```
┌───────────────────────────────────────────────┐
│ CORE ENTITIES                                 │
├───────────────────────────────────────────────┤
│ customers                                     │
│ users (auth.users - Supabase managed)         │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ LEAD MANAGEMENT                               │
├───────────────────────────────────────────────┤
│ leads                                         │
│ messages                                      │
│ contact_messages                              │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ HEALTH MANAGEMENT                             │
├───────────────────────────────────────────────┤
│ health_records                                │
│ vaccinations                                  │
│ medications                                   │
│ weight_records                                │
│ health_conditions                             │
│ health_condition_templates                    │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ DOG & BREEDING MANAGEMENT                     │
├───────────────────────────────────────────────┤
│ dog_breeds                                    │
│ dogs                                          │
│ puppies                                       │
│ litters                                       │
│ heats                                         │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ MEDIA & DOCUMENTS                             │
├───────────────────────────────────────────────┤
│ dog_photos                                    │
│ photos                                        │
│ file_uploads                                  │
│ documents                                     │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ FORMS & APPLICATIONS                          │
├───────────────────────────────────────────────┤
│ application_forms                             │
│ form_questions                                │
│ form_submissions                              │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ PROGRAMS & EVENTS                             │
├───────────────────────────────────────────────┤
│ breeding_programs                             │
│ program_users                                 │
│ breeder_program_associations                  │
│ events                                        │
│ event_rules                                   │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ WEBSITE                                       │
├───────────────────────────────────────────────┤
│ pages                                         │
└───────────────────────────────────────────────┘
```

## Current Database Entity Relationships

### Core Relationships:
```
users (auth.users) 1──────┐
                           │
                           ▼
                          *
                      customers
                          *
                           │
                           │
                          ▼1
                        leads
```

### Health Management Relationships:
```
            ┌───────────────1 dogs 1─────────────┐
            │                                    │
            ▼*                                   ▼*
    health_records                         vaccinations
            │                                    │
            │                                    │
            │                                    │
            │                  ┌─────────────────┘
            │                  │
            │                  │
            ▼                  ▼
            *                  *
    health_conditions     medications
            │                  │
            │                  │
            ▼                  │
            *                  │
   weight_records             │
            │                  │
            │                  │
            ▼                  ▼
            *                  *
    health_condition_templates
```

### Dog & Breeding Management Relationships:
```
dog_breeds
    │
    │
    ▼
    *
   dogs ───────────────┐
    │ ▲                │
    │ │                │
    │ └──────1 dam     │ 1 sire
    │                  │
    │                  │
    ▼*                 │
   heats               │
    │                  │
    │                  │
    ▼                  │
    *                  │
  litters ◄────────────┘
    │
    │
    ▼
    *
  puppies
```

### Media & Documents Relationships:
```
dogs 1─────────────┐
                    │
                    ▼*
                dog_photos
                    
dogs 1──┐
puppies 1┼─┐
litters 1┘ │
          │
          ▼*
        photos
        
dogs 1──┐
puppies 1┼─┐
litters 1┼─┤
customers 1┘ │
           │
           ▼*
        documents
           
           *
      file_uploads
```

## Proposed Database Schema

The proposed database schema reorganizes the tables with a consistent naming convention using prefixes to group related tables:

```
┌───────────────────────────────────────────────┐
│ CORE ENTITIES                                 │
├───────────────────────────────────────────────┤
│ core_customers                                │
│ core_users (auth.users - Supabase managed)    │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ LEAD MANAGEMENT                               │
├───────────────────────────────────────────────┤
│ lead_leads                                    │
│ lead_messages                                 │
│ lead_contact_messages                         │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ HEALTH MANAGEMENT                             │
├───────────────────────────────────────────────┤
│ health_records                                │
│ health_vaccinations                           │
│ health_medications                            │
│ health_weight_records                         │
│ health_conditions                             │
│ health_condition_templates                    │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ DOG & BREEDING MANAGEMENT                     │
├───────────────────────────────────────────────┤
│ breeding_dog_breeds                           │
│ breeding_dogs                                 │
│ breeding_puppies                              │
│ breeding_litters                              │
│ breeding_heats                                │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ MEDIA & DOCUMENTS                             │
├───────────────────────────────────────────────┤
│ media_dog_photos                              │
│ media_photos                                  │
│ media_file_uploads                            │
│ media_documents                               │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ FORMS & APPLICATIONS                          │
├───────────────────────────────────────────────┤
│ form_application_forms                        │
│ form_questions                                │
│ form_submissions                              │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ PROGRAMS & EVENTS                             │
├───────────────────────────────────────────────┤
│ program_breeding_programs                     │
│ program_users                                 │
│ program_breeder_associations                  │
│ program_events                                │
│ program_event_rules                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ WEBSITE                                       │
├───────────────────────────────────────────────┤
│ web_pages                                     │
└───────────────────────────────────────────────┘
```

## Key Changes in Proposed Schema:

1. **Consistent Naming Convention**: All tables use a prefix that indicates their category (health_, breeding_, media_, etc.)

2. **Standardized Polymorphic Associations**: For tables like health_vaccinations that can reference either a dog or puppy, we'll use a polymorphic association pattern:
   ```
   subject_type VARCHAR(20) NOT NULL, -- 'dog' or 'puppy'
   subject_id INTEGER NOT NULL
   ```
   This makes it clear what entity a record is associated with.

3. **Logical Grouping**: Tables are grouped by their functional area, making it easier to understand the database structure.

4. **Consistency with the UI**: The health module in the UI has a clear organization with dedicated pages for vaccinations, medications, and health records. The database structure will mirror this organization.
