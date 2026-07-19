import base64
from typing import Optional, Tuple

import httpx

from .config import PLATE_RECOGNIZER_TOKEN

_API_URL = "https://api.platerecognizer.com/v1/plate-reader/"


async def read_plate(image_bytes: bytes) -> Tuple[Optional[str], float]:
    image_b64 = base64.b64encode(image_bytes).decode("ascii")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            _API_URL,
            headers={"Authorization": f"Token {PLATE_RECOGNIZER_TOKEN}"},
            data={"regions": ["in"]},  # India — improves accuracy for Indian plates
            files={"upload": ("plate.jpg", image_bytes, "image/jpeg")},
        )
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    if not results:
        return None, 0.0

    # Pick the result with the highest confidence
    best = max(results, key=lambda r: r.get("score", 0))
    plate = best.get("plate", "").upper().replace(" ", "")
    confidence = round(float(best.get("score", 0.0)), 2)

    if not plate:
        return None, 0.0

    return plate, confidence
