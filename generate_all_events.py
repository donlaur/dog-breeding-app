#!/usr/bin/env python

"""
Utility script to generate events for all existing entities in the database.
This should be run once after setting up the events system to ensure all 
existing data has corresponding events.

Usage:
python generate_all_events.py
"""

import requests
import sys
import os
import json
import time

def main():
    # Set up base URL for the API
    base_url = os.environ.get('API_URL', 'http://localhost:5000/api')
    
    print(f"Using API URL: {base_url}")
    print("Generating events for all existing entities...")
    
    # Generate birthday events for all dogs
    try:
        print("\nGenerating birthday events for all dogs...")
        response = requests.post(f"{base_url}/events/generate/birthdays")
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Generated {len(data.get('events', []))} birthday events")
        else:
            print(f"Error generating birthday events: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exception generating birthday events: {str(e)}")
    
    # Generate events for all litters
    try:
        print("\nFetching all litters...")
        litters_response = requests.get(f"{base_url}/litters/")
        if litters_response.status_code == 200:
            litters = litters_response.json()
            print(f"Found {len(litters)} litters")
            
            # Generate events for each litter
            for litter in litters:
                litter_id = litter.get('id')
                litter_name = litter.get('litter_name') or f"#{litter_id}"
                print(f"Generating events for litter {litter_name}...")
                
                try:
                    event_response = requests.post(f"{base_url}/events/generate/litter/{litter_id}")
                    if event_response.status_code == 200:
                        event_data = event_response.json()
                        print(f"  Success! Generated {len(event_data.get('events', []))} events")
                    else:
                        print(f"  Error generating events for litter {litter_id}: {event_response.status_code}")
                        print(f"  {event_response.text}")
                except Exception as e:
                    print(f"  Exception generating events for litter {litter_id}: {str(e)}")
                
                # Add a small delay to avoid overwhelming the server
                time.sleep(0.2)
        else:
            print(f"Error fetching litters: {litters_response.status_code}")
            print(litters_response.text)
    except Exception as e:
        print(f"Exception fetching litters: {str(e)}")
    
    print("\nEvent generation complete!")

if __name__ == "__main__":
    main()