import base64
import json
import re
from typing import Optional, Tuple

import httpx

from .config import OPENAI_API_KEY, OPENAI_VISION_MODEL

_NON_ALNUM_RE = re.compile(r"[^A-Z0-9]")

_PROMPT = (
    "You are an ANPR (license plate recognition) system. Look at the image and find the "
    "vehicle license plate. Respond with ONLY a JSON object, no markdown, in the form "
    '{"plate": "<plate text with no spaces, uppercase, or null if no plate is visible>", '
    '"confidence": <number between 0 and 1 representing how sure you are>}.'
)


async def read_plate_llm(image_bytes: bytes) -> Tuple[Optional[str], float]:
    image_b64 = base64.b64encode(image_bytes).decode("ascii")

    payload = {
        "model": OPENAI_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }
        ],
        "max_tokens": 100,
        "temperature": 0,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"].strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        parsed = json.loads(content)
    except (json.JSONDecodeError, KeyError):
        return None, 0.0

    plate = parsed.get("plate")
    confidence = parsed.get("confidence", 0.0)

    if not plate:
        return None, 0.0

    cleaned = _NON_ALNUM_RE.sub("", str(plate).upper())
    if not cleaned:
        return None, 0.0

    try:
        confidence = round(float(confidence), 2)
    except (TypeError, ValueError):
        confidence = 0.0

    return cleaned, confidence
