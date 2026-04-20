def test_get_user_profile(client):
    import uuid
    device_id = f"test_user_{uuid.uuid4()}"
    
    client.post("/api/v1/pulse", json={
        "device_id": device_id,
        "lat": -1.2,
        "lng": 36.8
    })
    
    # Now get profile
    response = client.get(f"/api/v1/users/profile/{device_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["device_fingerprint"]) == 64  # SHA256 hashed
    assert "level" in data
    assert "total_points" in data
    assert data["total_points"] >= 10

def test_update_user_profile(client):
    import uuid
    device_id = f"test_user_{uuid.uuid4()}"
    
    # Create the user through pulse
    client.post("/api/v1/pulse", json={
        "device_id": device_id,
        "lat": -1.2,
        "lng": 36.8
    })
    
    # Update the profile
    update_payload = {
        "profile_name": "Test King",
        "avatar_url": "https://example.com/avatar.png"
    }
    
    response = client.put(f"/api/v1/users/profile/{device_id}", json=update_payload)
    assert response.status_code == 200
    
    # Verify update
    get_res = client.get(f"/api/v1/users/profile/{device_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["profile_name"] == "Test King"
    assert data["avatar_url"] == "https://example.com/avatar.png"
