import re
from typing import List, Optional, Tuple

import cv2
import numpy as np

_NON_ALNUM_RE = re.compile(r"[^A-Z0-9]")
_SHARPEN_KERNEL = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        import easyocr

        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


def _preprocess(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale small/distant plates so characters have more detail (capped to keep CPU OCR fast)
    h, w = gray.shape
    if max(h, w) < 600:
        scale = 600 / max(h, w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    elif max(h, w) > 1000:
        scale = 1000 / max(h, w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    # Boost contrast - helps a lot in dim or uneven lighting
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # Light denoise + sharpen (cheap ops, avoids slow bilateral filter on CPU)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    gray = cv2.filter2D(gray, -1, _SHARPEN_KERNEL)

    return gray


def _extract(results: List[Tuple]) -> Tuple[Optional[str], float]:
    fragments = []
    confidences = []
    for _bbox, text, confidence in results:
        cleaned = _NON_ALNUM_RE.sub("", text.upper())
        if cleaned:
            fragments.append(cleaned)
            confidences.append(confidence)

    if not fragments:
        return None, 0.0

    plate = "".join(fragments)
    avg_confidence = sum(confidences) / len(confidences)
    return plate, round(float(avg_confidence), 2)


def read_plate(image_bytes: bytes) -> Tuple[Optional[str], float]:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None, 0.0

    reader = _get_reader()

    # Enhanced image first - compensates for dim/uneven light, blur, small plates
    plate, confidence = _extract(reader.readtext(_preprocess(img)))
    if plate:
        return plate, confidence

    # Fall back to the raw frame in case enhancement hurt an already-good shot
    return _extract(reader.readtext(img))
