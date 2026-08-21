from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent
sys.path.append(str(ROOT_DIR))

from AI_Assistant.app import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
