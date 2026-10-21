from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import os
import sqlite3
import uuid
from datetime import datetime

app = Flask(
    __name__,
    static_folder=os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend-react",
        "dist",
        "assets"
    ),
    static_url_path="/assets"
)
CORS(app)

# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

crime_model_path = os.path.join(
    BASE_DIR, "models", "crime_type_model.pkl"
)

crime_tfidf_path = os.path.join(
    BASE_DIR, "models", "crime_type_tfidf.pkl"
)

severity_model_path = os.path.join(
    BASE_DIR, "models", "crime_severity_svm.pkl"
)

severity_tfidf_path = os.path.join(
    BASE_DIR, "models", "crime_severity_tfidf.pkl"
)

DATABASE = os.environ.get("DATABASE_PATH", os.path.join(BASE_DIR, "complaints.db"))


# =========================================================
# LOAD MODELS
# =========================================================

crime_model = joblib.load(crime_model_path)
crime_tfidf = joblib.load(crime_tfidf_path)

severity_model = joblib.load(severity_model_path)
severity_tfidf = joblib.load(severity_tfidf_path)


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():

    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            complaint_id TEXT UNIQUE NOT NULL,

            complaint TEXT NOT NULL,

            crime_type TEXT NOT NULL,

            severity TEXT NOT NULL,

            status TEXT NOT NULL,

            created_at TEXT NOT NULL,

            updated_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_db()


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    frontend_path = os.path.join(BASE_DIR, "frontend-react", "dist")
    return send_from_directory(frontend_path, "index.html")
# =========================================================
# PREDICT
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    complaint = data.get("complaint")

    if not complaint:

        return jsonify({
            "error": "Complaint text is required"
        }), 400

    # Model 1
    crime_features = crime_tfidf.transform([complaint])

    crime_type = crime_model.predict(
        crime_features
    )[0]

    # Model 2
    severity_features = severity_tfidf.transform(
        [complaint]
    )

    severity = severity_model.predict(
        severity_features
    )[0]

    return jsonify({
        "crime_type": str(crime_type),
        "severity": str(severity)
    })


# =========================================================
# SUBMIT COMPLAINT
# =========================================================

@app.route("/api/complaints", methods=["POST"])
def submit_complaint():

    data = request.get_json()

    complaint = data.get("complaint")

    if not complaint or not complaint.strip():

        return jsonify({
            "error": "Complaint text is required"
        }), 400

    complaint = complaint.strip()

    # -------------------------
    # Model 1
    # -------------------------

    crime_features = crime_tfidf.transform(
        [complaint]
    )

    crime_type = crime_model.predict(
        crime_features
    )[0]

    # -------------------------
    # Model 2
    # -------------------------

    severity_features = severity_tfidf.transform(
        [complaint]
    )

    severity = severity_model.predict(
        severity_features
    )[0]

    # -------------------------
    # Complaint ID
    # -------------------------

    complaint_id = (
        "CMP-" +
        uuid.uuid4().hex[:8].upper()
    )

    current_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn = get_db()

    conn.execute("""
        INSERT INTO complaints
        (
            complaint_id,
            complaint,
            crime_type,
            severity,
            status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        complaint_id,
        complaint,
        str(crime_type),
        str(severity),
        "Submitted",
        current_time,
        current_time
    ))

    conn.commit()
    conn.close()

    # IMPORTANT:
    # Do NOT return crime_type/severity
    # to the public dashboard.

    return jsonify({
        "message": "Complaint submitted successfully",
        "complaint_id": complaint_id,
        "status": "Submitted"
    })


# =========================================================
# PUBLIC - TRACK COMPLAINT
# =========================================================

@app.route(
    "/api/complaints/<complaint_id>",
    methods=["GET"]
)
def get_complaint(complaint_id):

    conn = get_db()

    complaint = conn.execute("""
        SELECT
            complaint_id,
            status,
            created_at,
            updated_at
        FROM complaints
        WHERE complaint_id = ?
    """, (complaint_id,)).fetchone()

    conn.close()

    if complaint is None:

        return jsonify({
            "error": "Complaint not found"
        }), 404

    return jsonify(dict(complaint))


# =========================================================
# POLICE - GET ALL COMPLAINTS
# =========================================================

@app.route(
    "/api/police/complaints",
    methods=["GET"]
)
def police_complaints():

    conn = get_db()

    complaints = conn.execute("""
        SELECT *
        FROM complaints
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return jsonify([
        dict(row)
        for row in complaints
    ])


# =========================================================
# POLICE - UPDATE STATUS
# =========================================================

@app.route(
    "/api/police/complaints/<complaint_id>/status",
    methods=["PUT"]
)
def update_status(complaint_id):

    data = request.get_json()

    new_status = data.get("status")

    allowed_statuses = [
        "Submitted",
        "Under Review",
        "In Progress",
        "Resolved"
    ]

    if new_status not in allowed_statuses:

        return jsonify({
            "error": "Invalid status"
        }), 400

    current_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn = get_db()

    result = conn.execute("""
        UPDATE complaints
        SET
            status = ?,
            updated_at = ?
        WHERE complaint_id = ?
    """, (
        new_status,
        current_time,
        complaint_id
    ))

    conn.commit()
    conn.close()

    if result.rowcount == 0:

        return jsonify({
            "error": "Complaint not found"
        }), 404

    return jsonify({
        "message": "Status updated successfully"
    })


# =========================================================
# POLICE - STATISTICAL ANALYSIS
# =========================================================

@app.route(
    "/api/police/statistics",
    methods=["GET"]
)
def police_statistics():

    conn = get_db()

    # -------------------------
    # Total complaints
    # -------------------------

    total = conn.execute("""
        SELECT COUNT(*) AS count
        FROM complaints
    """).fetchone()["count"]

    # -------------------------
    # Status distribution
    # -------------------------

    status_rows = conn.execute("""
        SELECT
            status,
            COUNT(*) AS count
        FROM complaints
        GROUP BY status
    """).fetchall()

    status_distribution = {
        row["status"]: row["count"]
        for row in status_rows
    }

    # -------------------------
    # Severity distribution
    # -------------------------

    severity_rows = conn.execute("""
        SELECT
            severity,
            COUNT(*) AS count
        FROM complaints
        GROUP BY severity
    """).fetchall()

    severity_distribution = {
        row["severity"]: row["count"]
        for row in severity_rows
    }

    # -------------------------
    # Crime type distribution
    # -------------------------

    crime_rows = conn.execute("""
        SELECT
            crime_type,
            COUNT(*) AS count
        FROM complaints
        GROUP BY crime_type
        ORDER BY count DESC
    """).fetchall()

    crime_distribution = [
        {
            "crime_type": row["crime_type"],
            "count": row["count"]
        }
        for row in crime_rows
    ]

    # -------------------------
    # Daily complaint trend
    # -------------------------

    trend_rows = conn.execute("""
        SELECT
            substr(created_at, 1, 10) AS date,
            COUNT(*) AS count
        FROM complaints
        GROUP BY date
        ORDER BY date
    """).fetchall()

    daily_trend = [
        {
            "date": row["date"],
            "count": row["count"]
        }
        for row in trend_rows
    ]

    conn.close()

    return jsonify({
        "total": total,

        "status_distribution":
            status_distribution,

        "severity_distribution":
            severity_distribution,

        "crime_distribution":
            crime_distribution,

        "daily_trend":
            daily_trend
    })


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )




