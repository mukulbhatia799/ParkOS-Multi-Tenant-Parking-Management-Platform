import { ParkingSlot } from "../types";
import { SlotCard } from "./SlotCard";

export function SlotGrid({
  slots,
  onSlotClick,
}: {
  slots: ParkingSlot[];
  onSlotClick?: (slot: ParkingSlot) => void;
}) {
  if (slots.length === 0) {
    return <p className="text-slate-500">No slots found for this lot.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {slots.map((slot) => (
        <SlotCard key={slot._id} slot={slot} onClick={onSlotClick ? () => onSlotClick(slot) : undefined} />
      ))}
    </div>
  );
}
