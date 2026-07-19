import axios from "axios";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Car, Clock, Ban } from "lucide-react";
import { getLots, getSlots } from "../api/slots.api";
import { createEntry, exitRecord, listActiveRecords } from "../api/records.api";
import { getBillingByRecord } from "../api/billing.api";
import { listLevels, getLevel } from "../api/map.api";
import { useAuth } from "../context/AuthContext";
import { disconnectSocket, getSocket } from "../socket/socketClient";
import { SlotGrid } from "../components/SlotGrid";
import { ParkingMapView } from "../components/ParkingMapView";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  BillingRecord,
  FeeCalculatedPayload,
  LevelMeta,
  MapCell,
  ParkingLot,
  ParkingSlot,
  SlotStatus,
  SlotStatusChangedPayload,
  VehicleType,
} from "../types";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") {
    return err.response.data.error;
  }
  return fallback;
}

function fmt(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

export function Dashboard() {
  const { token } = useAuth();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [activeRecords, setActiveRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [mapLevels, setMapLevels] = useState<LevelMeta[]>([]);
  const [mapActiveLevel, setMapActiveLevel] = useState(1);
  const [mapCells, setMapCells] = useState<MapCell[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // Entry modal
  const [entrySlot, setEntrySlot] = useState<ParkingSlot | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  // Exit confirmation modal
  const [exitConfirm, setExitConfirm] = useState<{ slotId: string; recordId: string; slotNumber: string } | null>(null);
  const [exitSubmitting, setExitSubmitting] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);

  // Billing modal
  const [billingModal, setBillingModal] = useState<BillingRecord | null>(null);
  const pendingBillingRecordId = useRef<string | null>(null);

  // Load lots
  useEffect(() => {
    getLots()
      .then((data) => {
        setLots(data);
        if (data.length > 0) setSelectedLotId(data[0]._id);
        else setLoading(false);
      })
      .catch(() => { setError("Failed to load parking lots"); setLoading(false); });
  }, []);

  // Load slots + active records + map levels when lot changes
  useEffect(() => {
    if (!selectedLotId) return;
    setLoading(true);
    setMapLevels([]);
    setMapCells([]);

    Promise.all([
      getSlots(selectedLotId),
      listActiveRecords(selectedLotId),
      listLevels(selectedLotId),
    ])
      .then(([slotsData, recordsData, lvls]) => {
        setSlots(slotsData);
        const recordMap: Record<string, string> = {};
        for (const record of recordsData) recordMap[record.slotId] = record._id;
        setActiveRecords(recordMap);
        setMapLevels(lvls);
        if (lvls.length > 0) setMapActiveLevel(lvls[0].level);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data"); setLoading(false); });
  }, [selectedLotId]);

  // Load map cells when active level changes
  useEffect(() => {
    if (!selectedLotId || mapLevels.length === 0) return;
    setMapLoading(true);
    getLevel(selectedLotId, mapActiveLevel)
      .then((data) => setMapCells(data.cells ?? []))
      .catch(() => setMapCells([]))
      .finally(() => setMapLoading(false));
  }, [selectedLotId, mapActiveLevel, mapLevels.length]);

  // Socket
  useEffect(() => {
    if (!token || !selectedLotId) return;
    const socket = getSocket(token);
    socket.emit("subscribe:lot", selectedLotId);

    function handleSlotUpdated(payload: SlotStatusChangedPayload) {
      if (payload.lotId !== selectedLotId) return;
      setSlots((prev) => prev.map((slot) =>
        slot._id === payload.slotId ? { ...slot, status: payload.status } : slot
      ));
    }

    function handleFeeCalculated(payload: FeeCalculatedPayload) {
      if (payload.parkingRecordId !== pendingBillingRecordId.current) return;
      pendingBillingRecordId.current = null;
      setBillingModal({
        _id: payload.billingRecordId,
        clientId: "",
        parkingRecordId: payload.parkingRecordId,
        lotId: payload.lotId,
        licensePlate: payload.licensePlate,
        durationMinutes: payload.durationMinutes,
        amountDue: payload.amountDue,
        currency: payload.currency,
        calculatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    socket.on("slot:updated", handleSlotUpdated);
    socket.on("fee:calculated", handleFeeCalculated);
    return () => {
      socket.off("slot:updated", handleSlotUpdated);
      socket.off("fee:calculated", handleFeeCalculated);
    };
  }, [token, selectedLotId]);

  useEffect(() => { return () => { disconnectSocket(); }; }, []);

  // ── Slot click handler (shared by SlotGrid & ParkingMapView) ──────────────

  function handleSlotClick(slot: ParkingSlot) {
    if (slot.status === SlotStatus.AVAILABLE) {
      setEntrySlot(slot);
      setLicensePlate("");
      setVehicleType(VehicleType.CAR);
      setEntryError(null);
    } else if (slot.status === SlotStatus.OCCUPIED) {
      const recordId = activeRecords[slot._id];
      if (recordId) {
        setExitConfirm({ slotId: slot._id, recordId, slotNumber: slot.slotNumber });
        setExitError(null);
      }
    }
  }

  async function handleEntrySubmit(e: FormEvent) {
    e.preventDefault();
    if (!entrySlot || !selectedLotId) return;
    setEntrySubmitting(true);
    setEntryError(null);
    try {
      const record = await createEntry(selectedLotId, entrySlot._id, licensePlate, vehicleType);
      setActiveRecords((prev) => ({ ...prev, [entrySlot._id]: record._id }));
      setEntrySlot(null);
    } catch (err) {
      setEntryError(extractErrorMessage(err, "Failed to record entry"));
    } finally {
      setEntrySubmitting(false);
    }
  }

  async function handleExitConfirm() {
    if (!exitConfirm) return;
    setExitSubmitting(true);
    setExitError(null);
    try {
      await exitRecord(exitConfirm.recordId);
      setActiveRecords((prev) => {
        const next = { ...prev };
        delete next[exitConfirm.slotId];
        return next;
      });
      pendingBillingRecordId.current = exitConfirm.recordId;
      setExitConfirm(null);

      const recordId = exitConfirm.recordId;
      setTimeout(async () => {
        if (pendingBillingRecordId.current !== recordId) return;
        try {
          const billing = await getBillingByRecord(recordId);
          pendingBillingRecordId.current = null;
          setBillingModal(billing as BillingRecord);
        } catch { /* not ready yet */ }
      }, 4000);
    } catch (err) {
      setExitError(extractErrorMessage(err, "Failed to process exit"));
    } finally {
      setExitSubmitting(false);
    }
  }

  const hasMap = mapCells.length > 0;

  const statCounts = useMemo(() => {
    const counts = { available: 0, occupied: 0, reserved: 0, outOfService: 0 };
    for (const slot of slots) {
      if (slot.status === SlotStatus.AVAILABLE) counts.available += 1;
      else if (slot.status === SlotStatus.OCCUPIED) counts.occupied += 1;
      else if (slot.status === SlotStatus.RESERVED) counts.reserved += 1;
      else counts.outOfService += 1;
    }
    return counts;
  }, [slots]);

  const statTiles = [
    { label: "Available", value: statCounts.available, icon: CheckCircle2, tone: "text-status-good", bg: "bg-green-50" },
    { label: "Occupied", value: statCounts.occupied, icon: Car, tone: "text-status-critical", bg: "bg-red-50" },
    { label: "Reserved", value: statCounts.reserved, icon: Clock, tone: "text-amber-600", bg: "bg-amber-50" },
    { label: "Out of Service", value: statCounts.outOfService, icon: Ban, tone: "text-slate-500", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Parking Slots</h2>
        {lots.length > 1 && (
          <select className="border border-slate-200 rounded-lg px-2 py-1 text-sm" value={selectedLotId ?? ""} onChange={(e) => setSelectedLotId(e.target.value)}>
            {lots.map((lot) => <option key={lot._id} value={lot._id}>{lot.name}</option>)}
          </select>
        )}
        {lots.length === 1 && <span className="text-sm text-slate-500">{lots[0].name}</span>}
      </div>

      {!loading && !error && lots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statTiles.map((tile) => (
            <Card key={tile.label} padded={false} className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${tile.bg} flex items-center justify-center shrink-0`}>
                <tile.icon className={`h-5 w-5 ${tile.tone}`} />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900 tabular-nums">{tile.value}</p>
                <p className="text-xs text-slate-500">{tile.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Click a <span className="text-status-good font-medium">green (free)</span> slot to record entry ·
        Click a <span className="text-status-critical font-medium">red (taken)</span> slot to record exit and view the bill.
      </p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && !error && lots.length === 0 && (
        <p className="text-slate-500">No parking lots found for your account.</p>
      )}

      {!loading && !error && lots.length > 0 && (
        <>
          {hasMap ? (
            <>
              {/* Level tabs */}
              {mapLevels.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {mapLevels.map((l) => (
                    <button
                      key={l.level}
                      onClick={() => setMapActiveLevel(l.level)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                        mapActiveLevel === l.level
                          ? "bg-accent-500 text-white border-accent-500"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {l.levelName || `Level ${l.level}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Visual map */}
              {mapLoading ? (
                <div className="h-32 flex items-center justify-center border rounded-xl bg-slate-50">
                  <p className="text-slate-400 text-sm">Loading map...</p>
                </div>
              ) : (
                <ParkingMapView
                  cells={mapCells}
                  slots={slots}
                  activeRecords={activeRecords}
                  onSlotClick={exitSubmitting ? () => {} : handleSlotClick}
                />
              )}
            </>
          ) : (
            /* Fallback slot grid when no map is saved */
            <SlotGrid slots={slots} onSlotClick={exitSubmitting ? undefined : handleSlotClick} />
          )}
        </>
      )}

      {/* Entry Modal */}
      {entrySlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-softLg p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{entrySlot.slotNumber}</span>
              <h3 className="text-lg font-semibold">Record Entry</h3>
            </div>
            <form onSubmit={handleEntrySubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">License Plate</label>
                <input
                  type="text" required autoFocus
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="border rounded w-full px-3 py-2 text-sm font-mono uppercase tracking-widest"
                  placeholder="MH12AB1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="border rounded w-full px-3 py-2 text-sm">
                  {Object.values(VehicleType).map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {entryError && <p className="text-status-critical text-sm">{entryError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => setEntrySlot(null)} disabled={entrySubmitting}>Cancel</Button>
                <Button type="submit" loading={entrySubmitting} disabled={!licensePlate.trim()}>Confirm Entry</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {exitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-softLg p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">{exitConfirm.slotNumber}</span>
              <h3 className="text-lg font-semibold">Record Exit</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Confirm exit for slot <strong>{exitConfirm.slotNumber}</strong>. The fee will be calculated automatically.
            </p>
            {exitError && <p className="text-status-critical text-sm">{exitError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setExitConfirm(null)} disabled={exitSubmitting}>Cancel</Button>
              <Button variant="danger" onClick={handleExitConfirm} loading={exitSubmitting}>Confirm Exit</Button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {billingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-5">
            <div className="text-center space-y-1">
              <div className="text-3xl">🧾</div>
              <h3 className="text-lg font-semibold text-slate-800">Parking Bill</h3>
            </div>
            <div className="border rounded-lg divide-y text-sm">
              <div className="flex justify-between px-4 py-2">
                <span className="text-slate-500">License Plate</span>
                <span className="font-mono font-semibold">{billingModal.licensePlate}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-slate-500">Duration</span>
                <span>{billingModal.durationMinutes} min ({Math.ceil(billingModal.durationMinutes / 60)} hr)</span>
              </div>
              <div className="flex justify-between px-4 py-2 bg-green-50">
                <span className="font-semibold text-slate-700">Amount Due</span>
                <span className="font-bold text-status-good text-base">{fmt(billingModal.amountDue, billingModal.currency)}</span>
              </div>
            </div>
            <Button onClick={() => setBillingModal(null)} className="w-full">Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}
