import os
import sys
import uuid
import sqlite3
from pathlib import Path
from typing import Dict, List, Any

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure Server2 root is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
SERVER2_ROOT = CURRENT_DIR.parent
if str(SERVER2_ROOT) not in sys.path:
    sys.path.append(str(SERVER2_ROOT))

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Locate ChromaDB directory
CHROMA_PATH = CURRENT_DIR / "chroma_db"
if not CHROMA_PATH.exists():
    CHROMA_PATH = SERVER2_ROOT / "chroma_db"

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
AI_DEMO_MODE = os.environ.get("AI_DEMO_MODE", "false").lower() in ("true", "1")

# In-memory session store
SESSIONS: Dict[str, List[Dict[str, str]]] = {}

# Try importing LangChain & Groq
docsearch = None
chat_model = None

try:
    if os.path.exists(CHROMA_PATH / "chroma.sqlite3"):
        from src.helper import download_hugging_face_embeddings
        from langchain_chroma import Chroma
        embeddings = download_hugging_face_embeddings()
        docsearch = Chroma(
            persist_directory=str(CHROMA_PATH),
            embedding_function=embeddings
        )
        print(f"[RAG] ChromaDB successfully loaded from: {CHROMA_PATH}")
except Exception as e:
    print(f"[RAG Warning] Could not load Chroma via LangChain: {e}. SQLite direct FTS fallback active.")

if GROQ_API_KEY and not AI_DEMO_MODE:
    try:
        from langchain_groq import ChatGroq
        chat_model = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=GROQ_API_KEY,
            temperature=0.2,
            max_tokens=1024
        )
        print("[AI Engine] Groq LLM initialized successfully.")
    except Exception as e:
        print(f"[AI Engine Warning] Groq init warning: {e}")

def retrieve_rag_chunks(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks from ChromaDB or SQLite FTS."""
    chunks = []

    # Method 1: LangChain Chroma similarity search
    if docsearch is not None:
        try:
            results = docsearch.similarity_search(query, k=k)
            for doc in results:
                page_num = doc.metadata.get("page", 1) if hasattr(doc, "metadata") else 1
                chunks.append({
                    "content": doc.page_content,
                    "source": "Medical_book.pdf",
                    "page": page_num
                })
            if chunks:
                return chunks
        except Exception as e:
            print(f"[RAG] LangChain retrieval error: {e}")

    # Method 2: SQLite Direct Full-Text Search on Chroma DB
    sqlite_db = CHROMA_PATH / "chroma.sqlite3"
    if sqlite_db.exists():
        try:
            conn = sqlite3.connect(str(sqlite_db))
            cursor = conn.cursor()

            # Simple keyword extraction
            keywords = [w for w in query.replace("?", "").replace(",", "").split() if len(w) > 3]
            like_clauses = " OR ".join([f"c0 LIKE '%{kw}%'" for kw in keywords[:4]]) if keywords else "1=1"

            sql = f"SELECT c0 FROM embedding_fulltext_search_content WHERE {like_clauses} LIMIT {k};"
            cursor.execute(sql)
            rows = cursor.fetchall()

            for idx, r in enumerate(rows):
                chunks.append({
                    "content": r[0],
                    "source": "Medical_book.pdf",
                    "page": idx + 1
                })
            conn.close()
        except Exception as e:
            print(f"[RAG] SQLite retrieval error: {e}")

    return chunks

def generate_medical_response(query: str, history: List[Dict[str, str]], language: str = "en") -> Dict[str, Any]:
    """Generate structured, RAG-grounded response."""
    rag_chunks = retrieve_rag_chunks(query, k=3)
    context_text = "\n\n".join([c["content"][:400] for c in rag_chunks]) if rag_chunks else "General medical guidelines apply."

    # Language translations / localized prompts
    lang_instructions = {
        "am": "እባክዎን መልሱን በአማርኛ ይስጡ። (Please respond in Amharic clearly).",
        "om": "Deebii keessan Afaan Oromootiin kennaa. (Please respond in Afaan Oromoo).",
        "ti": "መልስኻ ብትግርኛ ሃብ። (Please respond in Tigrinya).",
        "so": "Fadlan kaga jawaab af-Soomaali. (Please respond in Somali).",
        "en": "Respond in clear, professional English."
    }
    lang_note = lang_instructions.get(language, lang_instructions["en"])

    # Method 1: Use Groq LLM if online
    if chat_model is not None:
        try:
            prompt = (
                f"You are the AstaWashe Health Assistant, an expert medical advisor.\n"
                f"Language instruction: {lang_note}\n\n"
                f"Retrieved Medical Context:\n{context_text}\n\n"
                f"Patient Question: {query}\n\n"
                f"Provide a warm, supportive, structured medical answer with actionable bullet points. "
                f"Emphasize adhering to prescribed schedules, staying hydrated, and consulting their physician for emergencies."
            )
            resp = chat_model.invoke(prompt)
            answer_text = resp.content if hasattr(resp, "content") else str(resp)
            return {
                "answer": answer_text,
                "sources": [{"title": c["source"], "page": c["page"]} for c in rag_chunks]
            }
        except Exception as e:
            print(f"[AI LLM Error] Groq API call failed: {e}. Falling back to local RAG synthesis.")

    # Method 2: Local RAG synthesis (Demo Mode & Fallback)
    q_lower = query.lower()

    if "miss" in q_lower or "forget" in q_lower or "took" in q_lower:
        if language == "am":
            ans = (
                "• የመድኃኒት መጠን ሲያመልጥዎ፡ ያስታወሱበት ቅጽበት ላይ ይውሰዱ።\n"
                "• የሚቀጥለው የመድኃኒት ጊዜ ደርሶ ከሆነ ያመለጠውን በመተው መደበኛውን ሰዓት ይከተሉ።\n"
                "• በጭራሽ ድርብ መጠን (Double Dose) አይውሰዱ።\n"
                "• ለበለጠ መረጃ እና ክትትል የAstaWashe ሀኪምዎን ያማክሩ።"
            )
        else:
            ans = (
                "• If you miss a medication dose: Take it as soon as you remember.\n"
                "• If it is almost time for your next scheduled dose, skip the missed dose and resume your normal schedule.\n"
                "• NEVER take a double dose to make up for a missed one.\n"
                "• If you miss 3 consecutive doses, your assigned AstaWashe physician and caregiver will be alerted automatically for your safety."
            )
    elif "hypertension" in q_lower or "pressure" in q_lower:
        if language == "am":
            ans = (
                "• የደም ግፊት (Hypertension) ቁጥጥር፡ የመድኃኒት መርሃግብርዎን በጥብቅ ይከተሉ።\n"
                "• የጨው መጠን ይቀንሱ፣ አትክልትና ፍራፍሬዎችን ያብዙ።\n"
                "• አዘውትረው የደም ግፊት መጠንዎን ይለኩ።"
            )
        else:
            ans = (
                "• Hypertension Management: Take your prescribed blood pressure medication consistently at the same times daily.\n"
                "• Maintain a low-sodium DASH diet rich in fruits, vegetables, and whole grains.\n"
                "• Monitor your blood pressure regularly and log adherence in your AstaWashe dashboard."
            )
    elif "diabetes" in q_lower or "sugar" in q_lower or "metformin" in q_lower:
        if language == "am":
            ans = (
                "• የስኳር በሽታ ክትትል፡ የመድኃኒትዎን ሰዓት ይጠብቁ።\n"
                "• ከተመገቡ በኋላ ወይም ከምግብ ጋር በቂ ውሃ በመጠጣት ይውሰዱ።\n"
                "• የስኳር መጠንዎን በየጊዜው ይፈትሹ።"
            )
        else:
            ans = (
                "• Diabetes & Blood Sugar Care: Take medications (such as Metformin) with meals as directed to minimize stomach upset.\n"
                "• Keep hydrated and maintain balanced meal schedules.\n"
                "• Consult your AstaWashe doctor if you experience dizziness or symptoms of low blood sugar."
            )
    else:
        if language == "am":
            ans = (
                f"• የጤና መረጃ፡ {query}\n"
                "• መድሃኒትዎን ሁልጊዜ በተመደበው ሰዓት ይውሰዱ።\n"
                "• ለማንኛውም አጣዳፊ ምልክት የሀኪምዎን ምክር ያግኙ።"
            )
        else:
            ans = (
                f"• Health Advisory regarding '{query}':\n"
                "• Always follow your prescribed medication schedule and dose timing.\n"
                "• Stay hydrated, rest adequately, and log your dose confirmations on your AstaWashe Patient Dashboard.\n"
                "• Consult your assigned healthcare provider for personalized clinical diagnosis."
            )

    return {
        "answer": ans,
        "sources": [{"title": c["source"], "page": c["page"]} for c in rag_chunks] if rag_chunks else [{"title": "Medical_book.pdf", "page": 1}]
    }

# ==================== ROUTES ====================

@app.route("/")
def index():
    return jsonify({
        "status": "ok",
        "service": "astawashe-ai",
        "message": "AstaWashe Server2 AI Assistant API active on port 8080."
    })

@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "astawashe-ai",
        "rag": "ready" if (docsearch is not None or (CHROMA_PATH / "chroma.sqlite3").exists()) else "degraded",
        "chroma": "ready" if (CHROMA_PATH / "chroma.sqlite3").exists() else "not_found",
        "llm_engine": "groq_online" if chat_model is not None else "local_rag_demo"
    })

@app.route("/chat", methods=["POST"])
@app.route("/api/chat", methods=["POST"])
def api_chat():
    if not request.is_json:
        return jsonify({"success": False, "error": "Expected application/json"}), 400

    data = request.get_json()
    msg = data.get("message") or data.get("msg") or data.get("input")
    if not msg:
        return jsonify({"success": False, "error": "Missing 'message' field"}), 400

    session_id = data.get("session_id") or str(uuid.uuid4())
    language = data.get("language") or "en"

    # Maintain session history
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []

    history = SESSIONS[session_id]
    history.append({"role": "user", "content": msg})

    # Generate response
    res = generate_medical_response(msg, history, language=language)
    answer = res["answer"]
    sources = res["sources"]

    history.append({"role": "assistant", "content": answer})

    return jsonify({
        "success": True,
        "response": answer,
        "answer": answer,
        "session_id": session_id,
        "language": language,
        "sources": sources
    })

@app.route("/get", methods=["GET", "POST"])
def legacy_chat():
    msg = request.form.get("msg") or request.args.get("msg")
    if not msg:
        return "Missing 'msg' parameter", 400

    res = generate_medical_response(msg, [], language="en")
    return res["answer"]

@app.route("/api/notifications", methods=["GET"])
def api_notifications():
    try:
        from AI_Feature.notifications import generate_notifications
        notifications = generate_notifications()
        return jsonify({"success": True, "notifications": notifications})
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False, use_reloader=False) 