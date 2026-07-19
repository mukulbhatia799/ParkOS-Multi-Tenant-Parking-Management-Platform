import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { scanCamera } from "../api/cameras.api";
import { locateVehicle } from "../api/records.api";
import { CameraType } from "../types";

const AUTO_SCAN_INTERVAL_MS = 4000;
const LOW_CONFIDENCE_THRESHOLD = 0.4;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") {
    return err.response.data.error;
  }
  return fallback;
}

interface Props {
  cameraId: string;
  cameraType: CameraType;
}

export function CameraScanner({ cameraId, cameraType }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePlate, setDuplicatePlate] = useState<string | null>(null);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setAutoScan(false);
  }

  async function captureAndScan() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];

    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const res = await scanCamera(cameraId, base64);
      if (res.detected && res.detection) {
        const plate = res.detection.licensePlate;
        const pct = Math.round(res.detection.confidence * 100);
        const suffix = res.detection.confidence < LOW_CONFIDENCE_THRESHOLD ? " — low confidence, try again" : "";

        // For ENTRY cameras, check if this plate is already inside
        if (cameraType === CameraType.ENTRY) {
          try {
            const location = await locateVehicle(plate);
            if (location.parked) {
              setDuplicatePlate(plate);
              return;
            }
          } catch {
            // locate call failed — let the normal result show
          }
        }

        setResult(`Detected: ${plate} (${pct}% confidence)${suffix}`);
      } else {
        setResult("No plate detected — try again");
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Scan failed"));
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    if (!streaming || !autoScan) return;
    const interval = setInterval(captureAndScan, AUTO_SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, autoScan]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <>
      {/* Duplicate entry modal */}
      {duplicatePlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-softLg p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-semibold text-slate-800">Entry Already Exists</h2>
            </div>
            <p className="text-slate-600">
              Vehicle <span className="font-mono font-bold text-slate-900">{duplicatePlate}</span> is already inside
              the parking lot. A new entry has not been created.
            </p>
            <button
              onClick={() => setDuplicatePlate(null)}
              className="w-full py-2 rounded-lg bg-accent-500 text-white font-medium hover:bg-accent-600 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
        <video ref={videoRef} className="w-full rounded-lg bg-black" muted playsInline style={{ maxHeight: 240 }} />
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 flex-wrap items-center">
          {!streaming ? (
            <button onClick={startCamera} className="px-3 py-1 rounded-lg bg-accent-500 text-white text-sm hover:bg-accent-600">
              Start Camera
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="px-3 py-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                Stop Camera
              </button>
              <button
                onClick={captureAndScan}
                disabled={scanning}
                className="px-3 py-1 rounded-lg bg-accent-500 text-white text-sm hover:bg-accent-600 disabled:opacity-50"
              >
                {scanning ? "Scanning..." : "Scan Now"}
              </button>
              <label className="flex items-center gap-1 text-sm text-slate-600">
                <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
                Auto-scan every {AUTO_SCAN_INTERVAL_MS / 1000}s
              </label>
            </>
          )}
        </div>

        {result && <p className="text-sm text-slate-700">{result}</p>}
        {error && <p className="text-sm text-status-critical">{error}</p>}
      </div>
    </>
  );
}
