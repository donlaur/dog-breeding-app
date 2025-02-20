"""
breeds.py

This module defines the Blueprint for breed-related endpoints,
including retrieving all dog breeds, the breeding program details,
and litters data.

The endpoints are designed to be modular and independent from the dogs module.
This helps in tracking down errors and changes more easily.
"""

import os
from flask import Blueprint, jsonify
from server.supabase_client import supabase

breeds_bp = Blueprint("breeds_bp", __name__)

@breeds_bp.route("/", methods=["GET"])
def get_all_breeds():
    """
    Retrieve all dog breed records from the database.
    """
    response = supabase.table("dog_breeds").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])

@breeds_bp.route("/program", methods=["GET"])
def get_breeder_program():
    """
    Retrieve the breeding program with the name "Laur's Classic Corgis".
    This endpoint returns details of the breeding program.
    """
    response = (
        supabase.table("breeding_programs")
        .select("*")
        .eq("name", "Laur's Classic Corgis")
        .limit(1)
        .execute()
    )
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    data = rdict.get("data") or []
    return jsonify(data[0] if data else {"error": "Breeding program not found"})

@breeds_bp.route("/litters", methods=["GET"])
def get_litters():
    """
    Retrieve all litter records from the database.
    """
    response = supabase.table("litters").select("*").execute()
    rdict = response.dict()
    if rdict.get("error"):
        return jsonify({"error": rdict["error"]["message"]}), 400
    return jsonify(rdict.get("data") or [])
