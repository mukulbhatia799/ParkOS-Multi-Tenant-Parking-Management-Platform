import os

from dotenv import load_dotenv

load_dotenv()

PORT = int(os.environ.get("PORT", "8000"))
CAMERA_SERVICE_URL = os.environ.get("CAMERA_SERVICE_URL", "http://localhost:4004")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "dev-internal-key-change-me")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4o-mini")
PLATE_RECOGNIZER_TOKEN = os.environ.get("PLATE_RECOGNIZER_TOKEN", "")
