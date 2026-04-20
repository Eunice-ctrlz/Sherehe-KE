import pytest

def test_create_squad(client):
    # Use the client to create a squad
    payload = {
        "name": "Test Squad",
        "device_fingerprint": "test_device_squad_tester_01"
    }
    response = client.post("/api/v1/squads", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "squad_id" in data
    assert "invite_code" in data
    assert data["name"] == "Test Squad"
    
    # Check if length of code is 6 (or whatever generate_invite_code provides)
    assert len(data["invite_code"]) == 6

def test_join_squad(client):
    # Setup - generate a new squad first
    payload = {
        "name": "Joinable Squad",
        "device_fingerprint": "test_device_squad_creator"
    }
    create_res = client.post("/api/v1/squads", json=payload)
    assert create_res.status_code == 200
    invite_code = create_res.json()["invite_code"]
    
    # Try joining using another fingerprint
    join_url = f"/api/v1/squads/{invite_code}/join?device_fingerprint=test_device_squad_joiner"
    join_res = client.post(join_url)
    
    assert join_res.status_code == 200
    
    join_data = join_res.json()
    assert join_data["status"] == "success"
    assert join_data["squad_name"] == "Joinable Squad"

def test_pulse_endpoint(client):
    import uuid
    random_device = f"test_device_{uuid.uuid4()}"
    # Post a new pulse
    payload = {
        "device_id": random_device,
        "lat": -1.2921,
        "lng": 36.8219,
        "venue": "Test Venue"
    }
    response = client.post("/api/v1/pulse", json=payload)
    
    # Since we push to Redis in our endpoint, the test runner in Docker has Redis.
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "pulsed"
    assert data["expires_in"] == 10800
    
    # We should have increased the points for the user
    # Check user endpoint
    profile_response = client.get(f"/api/v1/users/profile/{random_device}")
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        assert profile_data["total_points"] >= 10
