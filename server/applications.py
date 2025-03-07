"""
Applications API for managing puppy application forms and submissions.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from server.supabase_client import supabase
from server.middleware.auth import token_required
import json

applications_bp = Blueprint('applications', __name__)

# Form Builder API Endpoints

@applications_bp.route('/api/application-forms', methods=['GET'])
@token_required
def get_application_forms(current_user):
    """Get all application forms for the current breeder"""
    try:
        forms = supabase.table("application_forms").select("*").eq("breeder_id", current_user['id']).execute()
        return jsonify({"success": True, "data": forms.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/application-forms/<form_id>', methods=['GET'])
@token_required
def get_application_form(current_user, form_id):
    """Get a specific application form with its questions"""
    try:
        # Get the form
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found"}), 404
        
        # Check if the form belongs to the current breeder
        if form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Get the questions for this form
        questions = supabase.table("form_questions").select("*").eq("form_id", form_id).order("order_position").execute()
        
        result = {
            "form": form.data[0],
            "questions": questions.data
        }
        
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/application-forms', methods=['POST'])
@token_required
def create_application_form(current_user):
    """Create a new application form"""
    try:
        data = request.json
        
        required_fields = ['name']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        form_data = {
            "breeder_id": current_user['id'],
            "name": data['name'],
            "description": data.get('description'),
            "is_active": data.get('is_active', True),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("application_forms").insert(form_data).execute()
        
        # If questions are provided, create them
        new_form = response.data[0]
        questions = data.get('questions', [])
        
        if questions:
            question_data = []
            for i, question in enumerate(questions):
                question_data.append({
                    "form_id": new_form['id'],
                    "question_text": question['question_text'],
                    "description": question.get('description'),
                    "question_type": question['question_type'],
                    "is_required": question.get('is_required', True),
                    "order_position": i,
                    "options": question.get('options'),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
            
            supabase.table("form_questions").insert(question_data).execute()
        
        return jsonify({"success": True, "data": new_form}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/application-forms/<form_id>', methods=['PUT'])
@token_required
def update_application_form(current_user, form_id):
    """Update an existing application form"""
    try:
        # Check if form exists and belongs to this breeder
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found"}), 404
        
        if form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        data = request.json
        form_data = {
            "name": data.get('name', form.data[0]['name']),
            "description": data.get('description', form.data[0]['description']),
            "is_active": data.get('is_active', form.data[0]['is_active']),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("application_forms").update(form_data).eq("id", form_id).execute()
        
        return jsonify({"success": True, "data": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/application-forms/<form_id>', methods=['DELETE'])
@token_required
def delete_application_form(current_user, form_id):
    """Delete an application form and all its questions"""
    try:
        # Check if form exists and belongs to this breeder
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found"}), 404
        
        if form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Delete the form (this will cascade delete the questions)
        supabase.table("application_forms").delete().eq("id", form_id).execute()
        
        return jsonify({"success": True, "message": "Form deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Form Questions API

@applications_bp.route('/api/form-questions', methods=['POST'])
@token_required
def create_form_question(current_user):
    """Add a new question to a form"""
    try:
        data = request.json
        
        required_fields = ['form_id', 'question_text', 'question_type', 'order_position']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Check if the form belongs to this breeder
        form = supabase.table("application_forms").select("*").eq("id", data['form_id']).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found"}), 404
        
        if form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        question_data = {
            "form_id": data['form_id'],
            "question_text": data['question_text'],
            "description": data.get('description'),
            "question_type": data['question_type'],
            "is_required": data.get('is_required', True),
            "order_position": data['order_position'],
            "options": data.get('options'),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("form_questions").insert(question_data).execute()
        
        return jsonify({"success": True, "data": response.data[0]}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/form-questions/<question_id>', methods=['PUT'])
@token_required
def update_form_question(current_user, question_id):
    """Update an existing form question"""
    try:
        # Get the question and check if the associated form belongs to this breeder
        question = supabase.table("form_questions").select("*").eq("id", question_id).execute()
        if not question.data:
            return jsonify({"success": False, "error": "Question not found"}), 404
        
        form_id = question.data[0]['form_id']
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        
        if not form.data or form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        data = request.json
        question_data = {
            "question_text": data.get('question_text', question.data[0]['question_text']),
            "description": data.get('description', question.data[0]['description']),
            "question_type": data.get('question_type', question.data[0]['question_type']),
            "is_required": data.get('is_required', question.data[0]['is_required']),
            "order_position": data.get('order_position', question.data[0]['order_position']),
            "options": data.get('options', question.data[0]['options']),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("form_questions").update(question_data).eq("id", question_id).execute()
        
        return jsonify({"success": True, "data": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/form-questions/<question_id>', methods=['DELETE'])
@token_required
def delete_form_question(current_user, question_id):
    """Delete a form question"""
    try:
        # Get the question and check if the associated form belongs to this breeder
        question = supabase.table("form_questions").select("*").eq("id", question_id).execute()
        if not question.data:
            return jsonify({"success": False, "error": "Question not found"}), 404
        
        form_id = question.data[0]['form_id']
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        
        if not form.data or form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Delete the question
        supabase.table("form_questions").delete().eq("id", question_id).execute()
        
        return jsonify({"success": True, "message": "Question deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/form-questions/reorder', methods=['POST'])
@token_required
def reorder_form_questions(current_user):
    """Reorder questions in a form"""
    try:
        data = request.json
        
        if not data.get('form_id') or not data.get('questions'):
            return jsonify({"success": False, "error": "Missing form_id or questions"}), 400
        
        # Check if the form belongs to this breeder
        form = supabase.table("application_forms").select("*").eq("id", data['form_id']).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found"}), 404
        
        if form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Update each question's order_position
        for question in data['questions']:
            supabase.table("form_questions").update({
                "order_position": question['order_position'],
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", question['id']).execute()
        
        return jsonify({"success": True, "message": "Questions reordered successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Public Form Submission API

@applications_bp.route('/api/public/forms/<form_id>', methods=['GET'])
def get_public_form(form_id):
    """Get a form for public view (without exposing sensitive data)"""
    try:
        # Get the form
        form = supabase.table("application_forms").select("id,name,description").eq("id", form_id).eq("is_active", True).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found or inactive"}), 404
        
        # Get the questions for this form
        questions = supabase.table("form_questions").select("id,question_text,description,question_type,is_required,order_position,options").eq("form_id", form_id).order("order_position").execute()
        
        result = {
            "form": form.data[0],
            "questions": questions.data
        }
        
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/public/forms/<form_id>/submit', methods=['POST'])
def submit_form(form_id):
    """Submit an application form"""
    try:
        data = request.json
        
        # Check if the form exists and is active
        form = supabase.table("application_forms").select("id").eq("id", form_id).eq("is_active", True).execute()
        if not form.data:
            return jsonify({"success": False, "error": "Form not found or inactive"}), 404
        
        # Validate required fields
        required_fields = ['applicant_name', 'applicant_email', 'responses']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Validate that responses match the form questions
        questions = supabase.table("form_questions").select("id,question_text,is_required").eq("form_id", form_id).execute().data
        required_question_ids = [q['id'] for q in questions if q['is_required']]
        
        responses_data = data['responses']
        response_question_ids = [r['question_id'] for r in responses_data]
        
        # Check if all required questions have been answered
        missing_questions = []
        for q_id in required_question_ids:
            if q_id not in response_question_ids:
                missing_question = next((q for q in questions if q['id'] == q_id), None)
                if missing_question:
                    missing_questions.append(missing_question['question_text'])
        
        if missing_questions:
            return jsonify({
                "success": False, 
                "error": "Missing required answers", 
                "missing_questions": missing_questions
            }), 400
        
        # Create the submission
        submission_data = {
            "form_id": form_id,
            "puppy_id": data.get('puppy_id'),
            "applicant_name": data['applicant_name'],
            "applicant_email": data['applicant_email'],
            "applicant_phone": data.get('applicant_phone'),
            "status": "pending",
            "responses": responses_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("form_submissions").insert(submission_data).execute()
        
        return jsonify({"success": True, "data": {
            "id": response.data[0]['id'],
            "message": "Application submitted successfully"
        }}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Form Submissions API (for breeders)

@applications_bp.route('/api/form-submissions', methods=['GET'])
@token_required
def get_form_submissions(current_user):
    """Get all form submissions for the breeder's forms"""
    try:
        # Get all forms that belong to this breeder
        forms = supabase.table("application_forms").select("id").eq("breeder_id", current_user['id']).execute()
        if not forms.data:
            return jsonify({"success": True, "data": []}), 200
        
        form_ids = [form['id'] for form in forms.data]
        
        # Get all submissions for these forms
        submissions = []
        for form_id in form_ids:
            form_submissions = supabase.table("form_submissions").select("*").eq("form_id", form_id).order("created_at", desc=True).execute()
            submissions.extend(form_submissions.data)
        
        return jsonify({"success": True, "data": submissions}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/form-submissions/<submission_id>', methods=['GET'])
@token_required
def get_form_submission(current_user, submission_id):
    """Get a specific form submission"""
    try:
        # Get the submission
        submission = supabase.table("form_submissions").select("*").eq("id", submission_id).execute()
        if not submission.data:
            return jsonify({"success": False, "error": "Submission not found"}), 404
        
        # Get the form to check if it belongs to this breeder
        form_id = submission.data[0]['form_id']
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        
        if not form.data or form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Get the form questions to include question text
        questions = supabase.table("form_questions").select("id,question_text,question_type").eq("form_id", form_id).execute()
        
        # Create a dictionary of question texts by id
        question_dict = {q['id']: {'text': q['question_text'], 'type': q['question_type']} for q in questions.data}
        
        # Add question text to each response
        submission_data = submission.data[0]
        for response in submission_data['responses']:
            if response['question_id'] in question_dict:
                response['question_text'] = question_dict[response['question_id']]['text']
                response['question_type'] = question_dict[response['question_id']]['type']
        
        # If submission is for a specific puppy, get puppy details
        if submission_data.get('puppy_id'):
            puppy = supabase.table("puppies").select("id,name,gender,color,litter_id").eq("id", submission_data['puppy_id']).execute()
            if puppy.data:
                submission_data['puppy'] = puppy.data[0]
        
        return jsonify({"success": True, "data": submission_data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@applications_bp.route('/api/form-submissions/<submission_id>/status', methods=['PUT'])
@token_required
def update_submission_status(current_user, submission_id):
    """Update the status of a form submission"""
    try:
        data = request.json
        if 'status' not in data:
            return jsonify({"success": False, "error": "Missing status field"}), 400
        
        # Get the submission
        submission = supabase.table("form_submissions").select("*").eq("id", submission_id).execute()
        if not submission.data:
            return jsonify({"success": False, "error": "Submission not found"}), 404
        
        # Get the form to check if it belongs to this breeder
        form_id = submission.data[0]['form_id']
        form = supabase.table("application_forms").select("*").eq("id", form_id).execute()
        
        if not form.data or form.data[0]['breeder_id'] != current_user['id']:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Update the status
        update_data = {
            "status": data['status'],
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("form_submissions").update(update_data).eq("id", submission_id).execute()
        
        return jsonify({"success": True, "data": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500