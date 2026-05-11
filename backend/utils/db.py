from pathlib import Path
import sqlite3

DATABASE_PATH = Path(__file__).resolve().parent.parent / "database.db"
PROGRESS_COLUMNS = {
    "id",
    "user_id",
    "platform",
    "external_id",
    "name",
    "topic",
    "difficulty",
    "link",
    "status",
    "updated_at",
}


def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT NOT NULL
        )
        """
    )

    existing_columns = {
        row["name"] for row in conn.execute("PRAGMA table_info(progress)").fetchall()
    }
    if existing_columns and not PROGRESS_COLUMNS.issubset(existing_columns):
        conn.execute("DROP TABLE progress")

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            external_id TEXT NOT NULL,
            name TEXT NOT NULL,
            topic TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            link TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('waitlisted', 'completed')),
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, platform, external_id)
        )
        """
    )
    conn.commit()
    conn.close()
