import json
import os
import requests
import google.oauth2.service_account
import google.auth.transport.requests

# Paths
CRED_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gcp-credentials.json")
RULES_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "firestore.rules")

def deploy():
    if not os.path.exists(CRED_PATH):
        print(f"Error: {CRED_PATH} not found.")
        return
    if not os.path.exists(RULES_PATH):
        print(f"Error: {RULES_PATH} not found.")
        return

    # Load credentials
    creds = google.oauth2.service_account.Credentials.from_service_account_file(
        CRED_PATH,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    
    # Get access token
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    token = creds.token
    project_id = creds.project_id

    print(f"Project ID: {project_id}")
    print("Reading rules...")
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        rules_content = f.read()

    # Step 1: Create Ruleset
    print("Creating new ruleset...")
    ruleset_url = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/rulesets"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "source": {
            "files": [
                {
                    "content": rules_content,
                    "name": "firestore.rules"
                }
            ]
        }
    }
    
    r = requests.post(ruleset_url, headers=headers, json=payload)
    if r.status_code != 200:
        print(f"Failed to create ruleset: {r.status_code} - {r.text}")
        return
    
    ruleset_name = r.json().get("name")
    print(f"Successfully created ruleset: {ruleset_name}")

    # Step 2: Update Release to point to the new Ruleset
    print("Releasing ruleset to cloud.firestore...")
    release_url = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/releases/cloud.firestore"
    release_payload = {
        "release": {
            "name": f"projects/{project_id}/releases/cloud.firestore",
            "rulesetName": ruleset_name
        }
    }
    
    # We use PATCH to update the release
    r_release = requests.patch(
        f"{release_url}?update_mask=release.ruleset_name", 
        headers=headers, 
        json=release_payload
    )
    
    if r_release.status_code == 200:
        print("🎉 Successfully deployed Firestore rules programmatically without Firebase CLI!")
    else:
        print(f"Failed to update release: {r_release.status_code} - {r_release.text}")

if __name__ == "__main__":
    deploy()
