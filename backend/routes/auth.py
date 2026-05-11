from flask import Blueprint, current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash
from utils.db import get_db


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

def get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

def create_token(user_id: int, username: str) -> str:
    return get_serializer().dumps({"user_id": user_id, "username": username})


def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = get_serializer().loads(token, max_age=60 * 60 * 24 * 7)
    except (BadSignature, SignatureExpired):
        return None

    conn = get_db()
    user = conn.execute(
        "SELECT id, username FROM users WHERE id = ?",
        (payload["user_id"],),
    ).fetchone()
    conn.close()
    return dict(user) if user else None


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    conn = get_db()
    existing_user = conn.execute(
        "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
        (username,),
    ).fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists."}), 409

    hashed_password = generate_password_hash(password)
    cursor = conn.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (username, hashed_password),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return (
        jsonify(
            {
                "message": "Registered successfully.",
                "token": create_token(user_id, username),
                "user": {"id": user_id, "username": username},
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT id, username, password FROM users WHERE LOWER(username) = LOWER(?)",
        (username,),
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid username or password."}), 401

    stored_password = user["password"] or ""
    password_ok = stored_password == password

    if not password_ok:
        try:
            password_ok = check_password_hash(stored_password, password)
        except ValueError:
            password_ok = False

    if not password_ok:
        return jsonify({"error": "Invalid username or password."}), 401

    return jsonify(
        {
            "message": "Logged in successfully.",
            "token": create_token(user["id"], user["username"]),
            "user": {"id": user["id"], "username": user["username"]},
        }
    )
