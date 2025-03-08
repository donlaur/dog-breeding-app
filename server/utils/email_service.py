"""
Email service for sending notifications.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

class EmailService:
    """Service for sending email notifications"""
    
    @staticmethod
    def send_email(recipient, subject, html_content, text_content=None):
        """
        Send an email to the specified recipient.
        
        Args:
            recipient (str): Email address of the recipient
            subject (str): Subject of the email
            html_content (str): HTML content of the email
            text_content (str, optional): Plain text content of the email
        
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Get email configuration from environment variables
            smtp_server = os.environ.get('SMTP_SERVER', '')
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
            smtp_username = os.environ.get('SMTP_USERNAME', '')
            smtp_password = os.environ.get('SMTP_PASSWORD', '')
            sender_email = os.environ.get('SENDER_EMAIL', '')
            
            # If email is not configured, log the message and return
            if not all([smtp_server, smtp_port, smtp_username, smtp_password, sender_email]):
                current_app.logger.warning(
                    "Email not configured. Would have sent email to %s with subject: %s", 
                    recipient, subject
                )
                return False
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = sender_email
            message["To"] = recipient
            
            # Add text content if provided
            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            
            # Add HTML content
            message.attach(MIMEText(html_content, "html"))
            
            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(sender_email, recipient, message.as_string())
                
            current_app.logger.info("Email sent to %s with subject: %s", recipient, subject)
            return True
            
        except Exception as e:
            current_app.logger.error("Failed to send email: %s", str(e))
            return False
    
    @staticmethod
    def send_application_submitted_notification(breeder_email, applicant_name, form_name):
        """
        Send notification to breeder when a new application is submitted.
        
        Args:
            breeder_email (str): Email address of the breeder
            applicant_name (str): Name of the applicant
            form_name (str): Name of the application form
        
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = f"New Application Submission: {form_name}"
        
        html_content = f"""
        <html>
            <body>
                <h2>New Application Submitted</h2>
                <p>Hello,</p>
                <p>A new application has been submitted by <strong>{applicant_name}</strong> for <strong>{form_name}</strong>.</p>
                <p>Please log in to your breeder dashboard to review the application.</p>
                <p>Thank you,<br>Breeder Tools Team</p>
            </body>
        </html>
        """
        
        text_content = f"""
        New Application Submitted
        
        Hello,
        
        A new application has been submitted by {applicant_name} for {form_name}.
        
        Please log in to your breeder dashboard to review the application.
        
        Thank you,
        Breeder Tools Team
        """
        
        return EmailService.send_email(breeder_email, subject, html_content, text_content)
    
    @staticmethod
    def send_application_status_update(applicant_email, applicant_name, form_name, status):
        """
        Send notification to applicant when their application status is updated.
        
        Args:
            applicant_email (str): Email address of the applicant
            applicant_name (str): Name of the applicant
            form_name (str): Name of the application form
            status (str): New status of the application
        
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        status_display = status.capitalize()
        subject = f"Application Status Update: {status_display}"
        
        # Customize message based on status
        status_message = ""
        if status == "approved":
            status_message = "Congratulations! Your application has been approved."
        elif status == "rejected":
            status_message = "We regret to inform you that your application has not been approved at this time."
        elif status == "waitlist":
            status_message = "Your application has been placed on our waitlist."
        else:
            status_message = "Your application status has been updated."
        
        html_content = f"""
        <html>
            <body>
                <h2>Application Status Update</h2>
                <p>Hello {applicant_name},</p>
                <p>{status_message}</p>
                <p>Your application for <strong>{form_name}</strong> is now: <strong>{status_display}</strong></p>
                <p>If you have any questions, please contact the breeder directly.</p>
                <p>Thank you,<br>Breeder Tools Team</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Application Status Update
        
        Hello {applicant_name},
        
        {status_message}
        
        Your application for {form_name} is now: {status_display}
        
        If you have any questions, please contact the breeder directly.
        
        Thank you,
        Breeder Tools Team
        """
        
        return EmailService.send_email(applicant_email, subject, html_content, text_content)
