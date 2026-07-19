import axios from "axios";
import { FormEvent, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { locateVehicle } from "../api/records.api";
import { VehicleLocateResult } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") {
    return err.response.data.error;
  }
  return fallback;
}

export function VehicleLocator() {
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<VehicleLocateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!plate.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await locateVehicle(plate.trim());
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to locate vehicle"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Vehicle Locator</h2>
        <p className="text-sm text-slate-500">Search by license plate to find where a vehicle is parked.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="e.g. MH12AB1234"
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
            autoFocus
          />
        </div>
        <Button type="submit" loading={loading}>Locate</Button>
      </form>

      {error && <p className="text-status-critical text-sm">{error}</p>}

      {result && (
        <Card className="space-y-2">
          <p className="text-sm">
            <span className="font-medium text-slate-700">Plate:</span> {result.vehicle.licensePlate}
          </p>
          <p className="text-sm">
            <span className="font-medium text-slate-700">Type:</span> {result.vehicle.type}
          </p>
          {result.parked && result.location ? (
            <>
              <p className="flex items-center gap-1.5 text-sm text-status-good font-medium">
                <MapPin className="h-3.5 w-3.5" /> Currently parked
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-700">Slot:</span> {result.location.slotNumber}
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-700">Entry time:</span>{" "}
                {new Date(result.location.entryTime).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 font-medium">Not currently parked</p>
          )}
        </Card>
      )}
    </div>
  );
}
