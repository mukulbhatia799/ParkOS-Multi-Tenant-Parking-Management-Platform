import axios from "axios";
import { useEffect, useState } from "react";
import { getLots } from "../api/slots.api";
import { getCameras, getDetections, startSimulation, stopSimulation } from "../api/cameras.api";
import { useAuth } from "../context/AuthContext";
import { disconnectSocket, getSocket } from "../socket/socketClient";
import { Camera, CameraType, DetectionLog, ParkingLot } from "../types";
import { CameraScanner } from "../components/CameraScanner";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") {
    return err.response.data.error;
  }
  return fallback;
}

export function Cameras() {
  const { token } = useAuth();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<DetectionLog[]>([]);
  const [simulating, setSimulating] = useState<Record<string, boolean>>({});
  const [scanningCameraId, setScanningCameraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getLots()
      .then((data) => {
        setLots(data);
        if (data.length > 0) {
          setSelectedLotId(data[0]._id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load parking lots");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedLotId) return;

    setLoading(true);
    Promise.all([getCameras(selectedLotId), getDetections(selectedLotId)])
      .then(([camerasData, detectionsData]) => {
        setCameras(camerasData);
        setDetections(detectionsData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load cameras");
        setLoading(false);
      });
  }, [selectedLotId]);

  useEffect(() => {
    if (!token || !selectedLotId) return;

    const socket = getSocket(token);
    socket.emit("subscribe:lot", selectedLotId);

    function handleDetection(payload: DetectionLog) {
      if (payload.lotId !== selectedLotId) return;
      setDetections((prev) => [payload, ...prev].slice(0, 50));
    }

    socket.on("detection:created", handleDetection);

    return () => {
      socket.off("detection:created", handleDetection);
    };
  }, [token, selectedLotId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  async function handleStart(cameraId: string) {
    setActionError(null);
    try {
      await startSimulation(cameraId);
      setSimulating((prev) => ({ ...prev, [cameraId]: true }));
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to start simulation"));
    }
  }

  async function handleStop(cameraId: string) {
    setActionError(null);
    try {
      await stopSimulation(cameraId);
      setSimulating((prev) => ({ ...prev, [cameraId]: false }));
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to stop simulation"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Cameras</h2>
        {lots.length > 1 && (
          <select
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
            value={selectedLotId ?? ""}
            onChange={(e) => setSelectedLotId(e.target.value)}
          >
            {lots.map((lot) => (
              <option key={lot._id} value={lot._id}>
                {lot.name}
              </option>
            ))}
          </select>
        )}
        {lots.length === 1 && <span className="text-sm text-slate-500">{lots[0].name}</span>}
      </div>

      {error && <p className="text-status-critical text-sm">{error}</p>}
      {actionError && <p className="text-status-critical text-sm">{actionError}</p>}
      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((camera) => (
            <Card key={camera._id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">{camera.name}</h3>
                <Badge tone={camera.cameraType === CameraType.ENTRY ? "success" : "danger"}>
                  {camera.cameraType}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Status: {camera.status}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => handleStart(camera._id)} disabled={simulating[camera._id]}>
                  Start Simulation
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleStop(camera._id)} disabled={!simulating[camera._id]}>
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setScanningCameraId((prev) => (prev === camera._id ? null : camera._id))}
                >
                  {scanningCameraId === camera._id ? "Close Live Scan" : "Live Scan"}
                </Button>
              </div>
              {scanningCameraId === camera._id && (
                <CameraScanner cameraId={camera._id} cameraType={camera.cameraType} />
              )}
            </Card>
          ))}
          {cameras.length === 0 && <p className="text-slate-500">No cameras found for this lot.</p>}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-md font-semibold text-slate-900">Recent Detections</h3>
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Plate</th>
                <th className="px-3 py-2 font-medium">Camera</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Captured At</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((detection) => (
                <tr key={detection._id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{detection.licensePlate}</td>
                  <td className="px-3 py-2">
                    <Badge tone={detection.cameraType === CameraType.ENTRY ? "success" : "danger"}>
                      {detection.cameraType}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{Math.round(detection.confidence * 100)}%</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(detection.capturedAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {detections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                    No detections yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
