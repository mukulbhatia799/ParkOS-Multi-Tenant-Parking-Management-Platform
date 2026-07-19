import asyncio
import random
from datetime import datetime, timezone
from typing import Optional

import httpx

from .config import CAMERA_SERVICE_URL, INTERNAL_API_KEY

DEFAULT_PLATES = ["MH12AB1234", "DL3CAF5678", "KA01XY9999", "TN09ZZ0001", "RJ14CD4321"]
DEFAULT_INTERVAL_SECONDS = 15

_tasks: dict[str, asyncio.Task] = {}


async def _run_loop(camera_id: str, plates: list[str], interval_seconds: int) -> None:
    index = 0
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            plate = plates[index % len(plates)]
            index += 1

            payload = {
                "cameraId": camera_id,
                "licensePlate": plate,
                "confidence": round(random.uniform(0.85, 0.99), 2),
                "capturedAt": datetime.now(timezone.utc).isoformat(),
            }

            try:
                await client.post(
                    f"{CAMERA_SERVICE_URL}/cv-ingest/detections",
                    json=payload,
                    headers={"X-Internal-Api-Key": INTERNAL_API_KEY},
                )
            except Exception as exc:  # noqa: BLE001
                print(f"[cv-service] failed to post detection for camera {camera_id}: {exc}")

            await asyncio.sleep(interval_seconds)


def start(camera_id: str, plates: Optional[list[str]] = None, interval_seconds: Optional[int] = None) -> None:
    stop(camera_id)
    task = asyncio.create_task(_run_loop(camera_id, plates or DEFAULT_PLATES, interval_seconds or DEFAULT_INTERVAL_SECONDS))
    _tasks[camera_id] = task
    print(f"[cv-service] started simulation for camera {camera_id}")


def stop(camera_id: str) -> bool:
    task = _tasks.pop(camera_id, None)
    if task:
        task.cancel()
        print(f"[cv-service] stopped simulation for camera {camera_id}")
        return True
    return False


def status() -> list[str]:
    return list(_tasks.keys())
