import base64
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from . import llm_ocr, ocr, plate_recognizer, simulator
from .config import INTERNAL_API_KEY, OPENAI_API_KEY, PLATE_RECOGNIZER_TOKEN

router = APIRouter()


class StartSimulationRequest(BaseModel):
    cameraId: str
    plates: Optional[List[str]] = None
    intervalSeconds: Optional[int] = None


class StopSimulationRequest(BaseModel):
    cameraId: str


class OcrRequest(BaseModel):
    image: str


@router.post("/cv/simulate/start")
async def start_simulation(req: StartSimulationRequest):
    simulator.start(req.cameraId, req.plates, req.intervalSeconds)
    return {"cameraId": req.cameraId, "simulating": True}


@router.post("/cv/simulate/stop")
async def stop_simulation(req: StopSimulationRequest):
    stopped = simulator.stop(req.cameraId)
    return {"cameraId": req.cameraId, "simulating": False, "wasRunning": stopped}


@router.get("/cv/simulate/status")
async def simulation_status():
    return {"activeCameraIds": simulator.status()}


@router.post("/cv/ocr")
async def ocr_scan(req: OcrRequest, x_internal_api_key: str = Header(default=None)):
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing internal API key")

    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if PLATE_RECOGNIZER_TOKEN:
        try:
            license_plate, confidence = await plate_recognizer.read_plate(image_bytes)
        except Exception:
            license_plate, confidence = None, 0.0
    elif OPENAI_API_KEY:
        try:
            license_plate, confidence = await llm_ocr.read_plate_llm(image_bytes)
        except Exception:
            license_plate, confidence = None, 0.0
    else:
        license_plate, confidence = ocr.read_plate(image_bytes)

    return {"licensePlate": license_plate, "confidence": confidence}
