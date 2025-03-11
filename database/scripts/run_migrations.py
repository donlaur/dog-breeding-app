import os
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_migration(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

# Execute specific migrations
def run_application_forms_migration():
    log_migration("Starting migration for application forms tables...")
    
    try:
        # Create application_forms table
        log_migration("Creating application_forms table...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE TABLE IF NOT EXISTS application_forms (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  breeder_id UUID REFERENCES users(id),
                  name TEXT NOT NULL,
                  description TEXT,
                  is_active BOOLEAN DEFAULT true,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """
            }
        ).execute()
        
        # Create form_questions table
        log_migration("Creating form_questions table...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE TABLE IF NOT EXISTS form_questions (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  form_id UUID REFERENCES application_forms(id) ON DELETE CASCADE,
                  question_text TEXT NOT NULL,
                  description TEXT,
                  question_type TEXT NOT NULL,
                  is_required BOOLEAN DEFAULT true,
                  order_position INTEGER NOT NULL,
                  options JSONB,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """
            }
        ).execute()
        
        # Create form_submissions table
        log_migration("Creating form_submissions table...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE TABLE IF NOT EXISTS form_submissions (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  form_id UUID REFERENCES application_forms(id),
                  puppy_id UUID REFERENCES puppies(id) NULL,
                  applicant_name TEXT NOT NULL,
                  applicant_email TEXT NOT NULL,
                  applicant_phone TEXT,
                  status TEXT DEFAULT 'pending',
                  responses JSONB NOT NULL,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """
            }
        ).execute()
        
        # Create indexes
        log_migration("Creating indexes for form tables...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE INDEX IF NOT EXISTS idx_form_questions_form_id ON form_questions(form_id);
                CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
                CREATE INDEX IF NOT EXISTS idx_form_submissions_puppy_id ON form_submissions(puppy_id);
                CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
                """
            }
        ).execute()
        
        log_migration("Application forms migration completed successfully")
        return True
    except Exception as e:
        log_migration(f"Error in application forms migration: {str(e)}")
        return False

def run_customers_migration():
    log_migration("Starting migration for customers and puppy status...")
    
    try:
        # Create customers table
        log_migration("Creating customers table...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE TABLE IF NOT EXISTS customers (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  name TEXT NOT NULL,
                  email TEXT,
                  phone TEXT,
                  address TEXT,
                  city TEXT,
                  state TEXT,
                  zip TEXT,
                  country TEXT DEFAULT 'USA',
                  notes TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """
            }
        ).execute()
        
        # Create index on customers
        log_migration("Creating index on customers email...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
                """
            }
        ).execute()
        
        # Add customer fields to puppies table
        log_migration("Adding customer reference fields to puppies table...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                ALTER TABLE puppies 
                ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS reservation_date TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS transaction_notes TEXT,
                ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL;
                """
            }
        ).execute()
        
        # Add index on puppy status
        log_migration("Creating index on puppies status...")
        supabase.rpc(
            'postgres_run_query', {
                'query': """
                CREATE INDEX IF NOT EXISTS idx_puppies_status ON puppies(status);
                """
            }
        ).execute()
        
        log_migration("Customers and puppy status migration completed successfully")
        return True
    except Exception as e:
        log_migration(f"Error in customers migration: {str(e)}")
        return False

def main():
    print("Starting migrations...")
    
    application_forms_success = run_application_forms_migration()
    if application_forms_success:
        customers_success = run_customers_migration()
    else:
        customers_success = False
    
    if application_forms_success and customers_success:
        print("All migrations completed successfully!")
    else:
        print("Some migrations failed. Check the logs for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()