from src.app import activities


def test_get_activities_returns_all_activities_and_no_store_header(client):
    response = client.get("/activities")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"

    data = response.json()
    assert data == activities
    assert "Chess Club" in data


def test_signup_adds_participant_to_activity(client):
    email = "newstudent@mergington.edu"

    response = client.post("/activities/Chess Club/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert email in activities["Chess Club"]["participants"]


def test_signup_rejects_unknown_activity(client):
    response = client.post("/activities/Unknown Club/signup", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_rejects_duplicate_participant(client):
    existing_email = activities["Chess Club"]["participants"][0]

    response = client.post("/activities/Chess Club/signup", params={"email": existing_email})

    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}


def test_unregister_removes_participant_from_activity(client):
    email = activities["Basketball"]["participants"][0]

    response = client.delete("/activities/Basketball/participants", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from Basketball"}
    assert email not in activities["Basketball"]["participants"]


def test_unregister_rejects_unknown_activity(client):
    response = client.delete("/activities/Unknown Club/participants", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_rejects_missing_participant(client):
    response = client.delete("/activities/Basketball/participants", params={"email": "missing@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Participant not found for this activity"}