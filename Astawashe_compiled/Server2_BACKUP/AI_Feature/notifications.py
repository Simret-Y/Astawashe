import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_groq import ChatGroq

ROOT_DIR = Path(__file__).resolve().parents[2]
PRISMA_NODE_SCRIPT = ROOT_DIR / "Server1" / "src" / "scripts" / "fetch_prisma_notification_data.js"
MODEL_NAME = "llama-3.3-70b-versatile"

def _get_node_executable() -> str:
    node = shutil.which("node")
    if node:
        return node
    raise RuntimeError("Node.js executable not found. Install Node.js and make sure it is on PATH.")


def _ensure_groq_key() -> str:
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise RuntimeError("GROQ_API_KEY is required in the environment for Groq tip generation.")
    os.environ["GROQ_API_KEY"] = groq_key
    return groq_key


def fetch_prisma_data() -> Dict[str, Any]:
    if not PRISMA_NODE_SCRIPT.exists():
        raise FileNotFoundError(f"Prisma bridge script not found at {PRISMA_NODE_SCRIPT}")

    node = _get_node_executable()
    process = subprocess.run(
        [node, str(PRISMA_NODE_SCRIPT)],
        cwd=str(ROOT_DIR / "Server1"),
        capture_output=True,
        text=True,
        check=True,
        env={**os.environ},
    )

    return json.loads(process.stdout)


def _extract_response_text(response: Any) -> str:
    if isinstance(response, dict):
        return (
            response.get("answer")
            or response.get("output_text")
            or response.get("text")
            or json.dumps(response)
        )
    return str(response)


def _summary_for_hospitals(hospitals: List[Dict[str, Any]]) -> str:
    if not hospitals:
        return "No hospital records are available."

    names = ", ".join([hospital.get("name", "Unnamed") for hospital in hospitals[:3]])
    total = len(hospitals)
    return f"The system tracks {total} hospitals, including {names}."


def _generate_prompt(patient: Dict[str, Any], hospitals: List[Dict[str, Any]]) -> str:
    active_cases = [case for case in patient.get("cases", []) if case.get("status") != "CLOSED"]
    case_status = (
        f"{len(active_cases)} active case(s): "
        + ", ".join([case.get("title", "untitled") + " (" + case.get("status", "unknown") + ")" for case in active_cases])
        if active_cases
        else "No active cases currently."
    )

    reminders = patient.get("reminders", [])
    habits = patient.get("habits", [])
    hospital_summary = _summary_for_hospitals(hospitals)

    return (
        f"You are a compassionate medical assistant. Create a short, personalized health notification message for a patient. "
        f"Use a supportive tone and provide a clear tip that helps the user manage their condition, medication, or wellness habits. "
        f"Do not include any markdown formatting. Keep the text concise and user-friendly.\n\n"
        f"Patient profile:\n"
        f"Name: {patient.get('fullName') or 'Patient'}\n"
        f"Email: {patient.get('email') or 'unknown'}\n"
        f"Gender: {patient.get('gender') or 'unknown'}\n"
        f"Age/Date of birth: {patient.get('dob') or 'unknown'}\n"
        f"Phone: {patient.get('phone') or 'unknown'}\n"
        f"Address: {patient.get('address') or 'unknown'}\n"
        f"Medical history: {patient.get('medicalHistory') or 'Not provided'}\n"
        f"Case summary: {patient.get('caseDescription') or 'No case description provided.'}\n"
        f"Current case status: {case_status}\n"
        f"Reminders count: {len(reminders)}\n"
        f"Habits tracked: {len(habits)}\n"
        f"Hospital context: {hospital_summary}\n\n"
        f"Output a short notification message addressed to the patient, focusing on the most helpful health tip for their current state."
    )


def _build_notification(patient: Dict[str, Any], hospitals: List[Dict[str, Any]], engine: ChatGroq) -> str:
    prompt = _generate_prompt(patient, hospitals)
    response = engine.invoke({"input": prompt})
    return _extract_response_text(response)


def generate_notifications() -> List[Dict[str, Any]]:
    _ensure_groq_key()
    data = fetch_prisma_data()
    hospitals = data.get("hospitals", [])
    patients = data.get("patients", [])

    engine = ChatGroq(model=MODEL_NAME, temperature=0.2, max_tokens=512)

    notifications: List[Dict[str, Any]] = []
    for patient in patients:
        message = _build_notification(patient, hospitals, engine)
        notifications.append(
            {
                "patientId": patient.get("id"),
                "userId": patient.get("userId"),
                "email": patient.get("email"),
                "fullName": patient.get("fullName"),
                "tipMessage": message,
            }
        )

    return notifications
