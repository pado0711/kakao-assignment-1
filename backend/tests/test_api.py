from datetime import date, timedelta

from fastapi.testclient import TestClient

from main import create_app, kst_today


def create_client(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    return TestClient(create_app(database_url))


def register(client, email="user@example.com", password="password123"):
    response = client.post("/auth/register", json={
        "email": email,
        "name": "테스터",
        "password": password,
    })
    assert response.status_code == 201
    return response.json()["session_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def next_weekday(weekday):
    today = kst_today()
    return today + timedelta(days=(weekday - today.isoweekday()) % 7)


def test_register_login_logout_and_expired_session_behavior(tmp_path):
    client = create_client(tmp_path)
    token = register(client)

    duplicate = client.post("/auth/register", json={
        "email": "user@example.com", "name": "중복", "password": "password123"
    })
    assert duplicate.status_code == 409

    wrong_password = client.post("/auth/login", json={
        "email": "user@example.com", "password": "not-the-password"
    })
    assert wrong_password.status_code == 401

    me = client.get("/auth/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["email"] == "user@example.com"

    assert client.post("/auth/logout", headers=auth(token)).status_code == 204
    assert client.get("/auth/me", headers=auth(token)).status_code == 401


def test_todo_crud_validation_filter_and_ownership(tmp_path):
    client = create_client(tmp_path)
    first_token = register(client, "first@example.com")
    second_token = register(client, "second@example.com")
    today = kst_today().isoformat()

    too_long = client.post("/todos", headers=auth(first_token), json={
        "content": "가" * 51, "date": today
    })
    assert too_long.status_code == 422

    created = client.post("/todos", headers=auth(first_token), json={
        "content": "첫 번째 할 일", "date": today
    })
    assert created.status_code == 201
    todo_id = created.json()["sourceId"]
    assert created.json()["status"] == "inProgress"

    assert client.get(f"/todos/{todo_id}", headers=auth(second_token)).status_code == 404
    assert client.put(f"/todos/{todo_id}", headers=auth(second_token), json={
        "status": "completed"
    }).status_code == 404

    toggled = client.put(f"/todos/{todo_id}", headers=auth(first_token), json={
        "status": "completed"
    })
    assert toggled.status_code == 200
    assert toggled.json()["status"] == "completed"

    completed = client.get(
        "/todos", headers=auth(first_token), params={"date": today, "filter": "completed"}
    )
    assert completed.json()["total"] == 1

    assert client.delete(f"/todos/{todo_id}", headers=auth(first_token)).status_code == 204
    assert client.get(f"/todos/{todo_id}", headers=auth(first_token)).status_code == 404


def test_weekday_recurrence_occurrence_exceptions_and_whole_rule_changes(tmp_path):
    client = create_client(tmp_path)
    token = register(client)
    monday = next_weekday(1)
    wednesday = next_weekday(3)
    start = min(monday, wednesday)
    end = max(monday, wednesday) + timedelta(days=14)

    created = client.post("/recurrences", headers=auth(token), json={
        "content": "운동하기",
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "weekdays": [1, 3, 3],
    })
    assert created.status_code == 201
    rule_id = created.json()["id"]
    assert created.json()["weekdays"] == [1, 3]

    occurrence_date = monday if monday >= start else monday + timedelta(days=7)
    listed = client.get("/todos", headers=auth(token), params={
        "date": occurrence_date.isoformat(), "filter": "all"
    })
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["kind"] == "recurring"

    changed = client.put(
        f"/recurrences/{rule_id}/occurrences/{occurrence_date.isoformat()}",
        headers=auth(token),
        json={"content": "오늘은 산책", "status": "completed"},
    )
    assert changed.status_code == 200
    assert changed.json()["content"] == "오늘은 산책"
    assert changed.json()["status"] == "completed"

    assert client.delete(
        f"/recurrences/{rule_id}/occurrences/{occurrence_date.isoformat()}",
        headers=auth(token),
    ).status_code == 204
    hidden = client.get("/todos", headers=auth(token), params={
        "date": occurrence_date.isoformat(), "filter": "all"
    })
    assert hidden.json()["total"] == 0

    updated = client.put(f"/recurrences/{rule_id}", headers=auth(token), json={
        "content": "새 운동",
        "weekdays": [3],
    })
    assert updated.status_code == 200
    assert updated.json()["weekdays"] == [3]

    invalid_day = client.put(
        f"/recurrences/{rule_id}/occurrences/{occurrence_date.isoformat()}",
        headers=auth(token),
        json={"status": "completed"},
    )
    assert invalid_day.status_code == 404

    assert client.delete(f"/recurrences/{rule_id}", headers=auth(token)).status_code == 204


def test_recurrence_rejects_invalid_range_and_non_occurrence_date(tmp_path):
    client = create_client(tmp_path)
    token = register(client)
    start = date(2026, 6, 24)

    invalid = client.post("/recurrences", headers=auth(token), json={
        "content": "잘못된 반복",
        "startDate": start.isoformat(),
        "endDate": (start - timedelta(days=1)).isoformat(),
        "weekdays": [start.isoweekday()],
    })
    assert invalid.status_code == 422

    created = client.post("/recurrences", headers=auth(token), json={
        "content": "정상 반복",
        "startDate": start.isoformat(),
        "endDate": None,
        "weekdays": [start.isoweekday()],
    })
    rule_id = created.json()["id"]
    wrong_date = start + timedelta(days=1)
    response = client.put(
        f"/recurrences/{rule_id}/occurrences/{wrong_date.isoformat()}",
        headers=auth(token),
        json={"status": "completed"},
    )
    assert response.status_code == 404
