import os

from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth import auth_bp
from routes.problems import problems_bp
from utils.db import init_db

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cp-trainer-dev-secret")
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(problems_bp)


@app.get("/")
def home():
    return jsonify({"message": "Backend running"})


init_db()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
