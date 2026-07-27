from urllib.parse import quote


def test_get_activities(client):
    # Arrange: client fixture provides a fresh TestClient and reset state

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success(client):
    # Arrange
    activity = "Chess Club"
    email = "alice@example.com"

    # Act
    path = f"/activities/{quote(activity)}/signup"
    resp = client.post(path, params={"email": email})

    # Assert
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Re-query to ensure participant was added
    get_resp = client.get("/activities")
    assert get_resp.status_code == 200
    activities = get_resp.json()
    assert email in activities[activity]["participants"]


def test_signup_duplicate(client):
    # Arrange
    activity = "Programming Class"
    email = "bob@example.com"

    # Act: first signup should succeed
    path = f"/activities/{quote(activity)}/signup"
    first = client.post(path, params={"email": email})
    assert first.status_code == 200

    # Act: second signup with same email should return 400
    second = client.post(path, params={"email": email})

    # Assert
    assert second.status_code == 400
    assert second.json().get("detail") in ("Student already signed up for this activity",)


def test_signup_not_found(client):
    # Arrange
    activity = "Nonexistent Club"
    email = "charlie@example.com"

    # Act
    path = f"/activities/{quote(activity)}/signup"
    resp = client.post(path, params={"email": email})

    # Assert
    assert resp.status_code == 404
    assert resp.json().get("detail") == "Activity not found"
