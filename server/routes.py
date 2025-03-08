"""
routes.py

Defines a main blueprint for miscellaneous routes (e.g., health-check).
"""

from flask import Blueprint, jsonify

main_bp = Blueprint("main_bp", __name__)

@main_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200
