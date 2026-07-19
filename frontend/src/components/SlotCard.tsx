import { ParkingSlot, SlotStatus } from "../types";

const statusColors: Record<SlotStatus, string> = {
  [SlotStatus.AVAILABLE]: "bg-green-50 border-green-300 text-status-good",
  [SlotStatus.OCCUPIED]: "bg-red-50 border-red-300 text-status-critical",
  [SlotStatus.RESERVED]: "bg-amber-50 border-amber-300 text-amber-700",
  [SlotStatus.OUT_OF_SERVICE]: "bg-slate-100 border-slate-300 text-slate-500",
};

export function SlotCard({ slot, onClick }: { slot: ParkingSlot; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-3 text-center transition ${statusColors[slot.status]} ${
        onClick ? "cursor-pointer hover:shadow-soft hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="font-semibold">{slot.slotNumber}</div>
      <div className="text-xs uppercase tracking-wide">{slot.type}</div>
      <div className="text-xs mt-1 capitalize">{slot.status.replace("_", " ")}</div>
    </div>
  );
}
