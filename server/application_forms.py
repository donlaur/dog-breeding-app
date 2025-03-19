"""
Application Forms API for managing application forms and submissions.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
from server.config import debug_log, debug_error

# Application Form Model
class ApplicationForm:
    @staticmethod
    def get_all():
        try:
            response = supabase.table("application_forms").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            debug_error(f"Error fetching application forms: {e}")
            return []
    
    @staticmethod
    def get_by_id(form_id):
        try:
            response = supabase.table("application_forms").select("*").eq("id", form_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error fetching application form by ID: {e}")
            return None
    
    @staticmethod
    def create_form(data):
        try:
            data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            response = supabase.table("application_forms").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error creating application form: {e}")
            return None

# Application Submission Model
class ApplicationSubmission:
    @staticmethod
    def get_all():
        try:
            response = supabase.table("application_submissions").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            debug_error(f"Error fetching application submissions: {e}")
            return []
    
    @staticmethod
    def get_by_id(submission_id):
        try:
            response = supabase.table("application_submissions").select("*").eq("id", submission_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error fetching application submission by ID: {e}")
            return None
    
    @staticmethod
    def get_by_form_id(form_id):
        try:
            response = supabase.table("application_submissions").select("*").eq("form_id", form_id).execute()
            return response.data if response.data else []
        except Exception as e:
            debug_error(f"Error fetching application submissions by form ID: {e}")
            return []
    
    @staticmethod
    def create_submission(data):
        try:
            data["created_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            response = supabase.table("application_submissions").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            debug_error(f"Error creating application submission: {e}")
            return None

# Create blueprint function
def create_application_forms_bp(db):
    application_forms_bp = Blueprint('application_forms', __name__)
    
    # Application Form Routes
    @application_forms_bp.route('', methods=['GET'])
    @token_required
    def get_application_forms(current_user):
        """Get all application forms"""
        try:
            forms = ApplicationForm.get_all()
            debug_log(f"Found {len(forms)} application forms")
            return jsonify({"success": True, "data": forms}), 200
        except Exception as e:
            debug_error(f"Error in get_application_forms: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @application_forms_bp.route('/<int:form_id>', methods=['GET'])
    @token_required
    def get_application_form(current_user, form_id):
        """Get a specific application form"""
        try:
            form = ApplicationForm.get_by_id(form_id)
            if not form:
                return jsonify({"success": False, "error": "Application form not found"}), 404
            
            return jsonify({"success": True, "data": form}), 200
        except Exception as e:
            debug_error(f"Error in get_application_form: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @application_forms_bp.route('', methods=['POST'])
    @token_required
    def create_application_form(current_user):
        """Create a new application form"""
        try:
            data = request.json
            
            # Validate required fields
            if 'title' not in data:
                return jsonify({"success": False, "error": "Title is required"}), 400
                
            if 'fields' not in data:
                return jsonify({"success": False, "error": "Form fields are required"}), 400
            
            # Create form
            form = ApplicationForm.create_form(data)
            
            return jsonify({"success": True, "data": form}), 201
        except Exception as e:
            debug_error(f"Error in create_application_form: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    # Application Submission Routes
    @application_forms_bp.route('/<int:form_id>/submissions', methods=['GET'])
    @token_required
    def get_form_submissions(current_user, form_id):
        """Get all submissions for a specific form"""
        try:
            submissions = ApplicationSubmission.get_by_form_id(form_id)
            debug_log(f"Found {len(submissions)} submissions for form {form_id}")
            return jsonify({"success": True, "data": submissions}), 200
        except Exception as e:
            debug_error(f"Error in get_form_submissions: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @application_forms_bp.route('/submissions/<int:submission_id>', methods=['GET'])
    @token_required
    def get_submission(current_user, submission_id):
        """Get a specific submission"""
        try:
            submission = ApplicationSubmission.get_by_id(submission_id)
            if not submission:
                return jsonify({"success": False, "error": "Submission not found"}), 404
            
            return jsonify({"success": True, "data": submission}), 200
        except Exception as e:
            debug_error(f"Error in get_submission: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @application_forms_bp.route('/<int:form_id>/submissions', methods=['POST'])
    def create_submission(form_id):
        """Create a new submission (public endpoint, no auth required)"""
        try:
            data = request.json
            
            # Validate form exists
            form = ApplicationForm.get_by_id(form_id)
            if not form:
                return jsonify({"success": False, "error": "Application form not found"}), 404
            
            # Add form_id to data
            data["form_id"] = form_id
            
            # Create submission
            submission = ApplicationSubmission.create_submission(data)
            
            return jsonify({"success": True, "data": submission, "message": "Application submitted successfully"}), 201
        except Exception as e:
            debug_error(f"Error in create_submission: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    return application_forms_bp