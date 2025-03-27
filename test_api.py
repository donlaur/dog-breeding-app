#!/usr/bin/env python3
"""
API Test Script for the Dog Breeding App.
This script tests various API endpoints to identify which ones might be failing.
"""
import requests
import json
import sys
import os
from pathlib import Path

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def test_endpoint(endpoint, method="GET", data=None, expected_status=200):
    """Test an API endpoint and print the result."""
    url = f"{BASE_URL}/{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=HEADERS)
        elif method == "POST":
            response = requests.post(url, headers=HEADERS, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=HEADERS, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=HEADERS)
        else:
            print(f"ERROR: Unsupported method {method}")
            return False
        
        status = response.status_code
        
        # Try to parse JSON response, but handle non-JSON responses gracefully
        try:
            response_data = response.json()
            content_type = "JSON"
        except json.JSONDecodeError:
            response_data = response.text[:100] + "..." if len(response.text) > 100 else response.text
            content_type = "Text"
        
        result = status == expected_status
        
        if result:
            print(f"✅ {method} {url}: Status {status} (success)")
        else:
            print(f"❌ {method} {url}: Status {status} (expected {expected_status})")
        
        if status != expected_status:
            print(f"   Response ({content_type}): {response_data}")
            
        return result
    
    except requests.RequestException as e:
        print(f"❌ {method} {url}: Connection error: {e}")
        return False

def test_upload_endpoint():
    """Test photo upload endpoints specifically."""
    print("\n===== Testing Photo Upload Endpoints =====")
    
    # List of endpoints that should support photo uploads based on registered routes
    upload_endpoints = [
        "dogs/upload",  # This is the only upload endpoint listed in the registered routes
    ]
    
    # Test each endpoint to see if it exists and accepts OPTIONS request
    for endpoint in upload_endpoints:
        url = f"{BASE_URL}/{endpoint}"
        try:
            # First check if the endpoint exists with OPTIONS
            response = requests.options(url)
            if response.status_code < 400:
                print(f"✅ OPTIONS {url}: Status {response.status_code} (endpoint exists)")
            else:
                print(f"❌ OPTIONS {url}: Status {response.status_code} (endpoint may not exist)")
        except requests.RequestException as e:
            print(f"❌ OPTIONS {url}: Connection error: {e}")
            
def test_file_upload():
    """Test actual file upload to different endpoints."""
    print("\n===== Testing File Upload Functionality =====")
    
    # Find a test image to upload
    # First check server/uploads directory
    server_uploads = Path('/Users/donlaur/Documents/GitHub/breeder-tools/dog-breeding-app/server/uploads')
    client_images = Path('/Users/donlaur/Documents/GitHub/breeder-tools/dog-breeding-app/client/public/images')
    
    test_image = None
    
    # Try to find an image in server/uploads
    if server_uploads.exists():
        image_files = list(server_uploads.glob('*.jpeg')) + list(server_uploads.glob('*.jpg'))
        if image_files:
            test_image = image_files[0]
    
    # If no image found in server/uploads, try client/public/images
    if test_image is None and client_images.exists():
        image_files = list(client_images.glob('*.png')) + list(client_images.glob('*.svg'))
        if image_files:
            test_image = image_files[0]
    
    if test_image is None:
        print("❌ No test image found. Skipping file upload tests.")
        return
    
    print(f"Using test image: {test_image}")
    
    # Test endpoints that should support file uploads based on registered routes
    endpoints = [
        "dogs/upload",  # This is the only upload endpoint listed in the registered routes
    ]
    
    for endpoint in endpoints:
        url = f"{BASE_URL}/{endpoint}"
        try:
            # Prepare the file for upload
            with open(test_image, 'rb') as f:
                files = {'file': (test_image.name, f, 'image/jpeg')}
                
                # Try with both 'file' and 'photo' parameters since we're not sure which one the endpoint expects
                response = requests.post(url, files=files)
                
                if response.status_code < 400:
                    print(f"✅ POST {url}: Status {response.status_code} (upload successful)")
                    try:
                        print(f"   Response: {response.json()}")
                    except:
                        print(f"   Response: {response.text[:100]}")
                else:
                    print(f"❌ POST {url}: Status {response.status_code} (upload failed)")
                    print(f"   Response: {response.text[:100]}")
                    
                    # Try with 'photo' instead of 'file'
                    with open(test_image, 'rb') as f:
                        files = {'photo': (test_image.name, f, 'image/jpeg')}
                        response = requests.post(url, files=files)
                        
                        if response.status_code < 400:
                            print(f"✅ POST {url} (with 'photo' parameter): Status {response.status_code} (upload successful)")
                            try:
                                print(f"   Response: {response.json()}")
                            except:
                                print(f"   Response: {response.text[:100]}")
                        else:
                            print(f"❌ POST {url} (with 'photo' parameter): Status {response.status_code} (upload failed)")
                            print(f"   Response: {response.text[:100]}")
        
        except requests.RequestException as e:
            print(f"❌ POST {url}: Connection error: {e}")
        except Exception as e:
            print(f"❌ POST {url}: Error: {e}")

def main():
    """Test all essential API endpoints."""
    print("\n===== Testing Dogs API =====")
    test_endpoint("dogs")
    # Removed test for dogs/full as we removed that endpoint
    
    print("\n===== Testing Litters API =====")
    test_endpoint("litters")
    test_endpoint("litters/dog/1")  # Test the endpoint we fixed earlier
    
    print("\n===== Testing Puppies API =====")
    test_endpoint("puppies")
    test_endpoint("puppies/litter/1")
    
    print("\n===== Testing Breeds API =====")
    test_endpoint("breeds")
    
    print("\n===== Testing Heats API =====")
    test_endpoint("heats")
    
    print("\n===== Testing Program API =====")
    test_endpoint("program")
    test_endpoint("program/dashboard")  # Authentication temporarily disabled for testing
    
    print("\n===== Testing Messages API =====")
    test_endpoint("messages/dashboard/messages")
    
    print("\n===== Testing Auth API =====")
    # Just test that the endpoints exist by using OPTIONS
    url = f"{BASE_URL}/auth/login"
    try:
        response = requests.options(url)
        if response.status_code < 400:
            print(f"✅ OPTIONS {url}: Status {response.status_code} (endpoint exists)")
        else:
            print(f"❌ OPTIONS {url}: Status {response.status_code} (endpoint may not exist)")
    except requests.RequestException as e:
        print(f"❌ OPTIONS {url}: Connection error: {e}")
    
    # Test photo upload endpoints specifically
    test_upload_endpoint()
    
    # Test file upload functionality
    test_file_upload()
    
    print("\nAPI Testing Complete!")

if __name__ == "__main__":
    # Check if server is running
    try:
        health_check = requests.get(f"{BASE_URL}/health-check", timeout=2)
        if health_check.status_code == 200:
            print("Server is running, starting tests...")
        else:
            print(f"Warning: Server health check returned status {health_check.status_code}")
    except requests.RequestException:
        print("ERROR: Could not connect to server. Make sure it's running on http://localhost:5000")
        print("Continuing with tests anyway...")
    
    main()