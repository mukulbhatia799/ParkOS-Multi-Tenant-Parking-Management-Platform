import { MapCell, ParkingSlot, SlotStatus } from "../types";

const CELL = 88;
const GAP  = 8;
const STEP = CELL + GAP;
const PAD  = 2;

function pos(row: number, col: number, minRow: number, minCol: number) {
  return {
    left: (col - minCol + PAD) * STEP + GAP / 2,
    top:  (row - minRow + PAD) * STEP + GAP / 2,
  };
}

function slotStatusClass(status: SlotStatus | undefined): string {
  switch (status) {
    case SlotStatus.AVAILABLE:      return "bg-green-100 border-green-400 text-green-800 cursor-pointer hover:bg-green-200 active:scale-95";
    case SlotStatus.OCCUPIED:       return "bg-red-100 border-red-400 text-red-800 cursor-pointer hover:bg-red-200 active:scale-95";
    case SlotStatus.RESERVED:       return "bg-orange-100 border-orange-300 text-orange-700 cursor-default";
    case SlotStatus.OUT_OF_SERVICE: return "bg-slate-200 border-slate-300 text-slate-400 cursor-default opacity-60";
    default:                        return "bg-slate-100 border-slate-300 text-slate-500 cursor-default";
  }
}

function slotStatusLabel(status: SlotStatus | undefined): string {
  switch (status) {
    case SlotStatus.AVAILABLE:      return "Free";
    case SlotStatus.OCCUPIED:       return "Taken";
    case SlotStatus.RESERVED:       return "Reserved";
    case SlotStatus.OUT_OF_SERVICE: return "N/A";
    default:                        return "—";
  }
}

function staticCellClass(type: MapCell["type"]): string {
  switch (type) {
    case "lane":  return "bg-amber-50 border-amber-200 text-amber-600 cursor-default";
    case "entry": return "bg-green-200 border-green-500 text-green-900 cursor-default font-bold";
    case "exit":  return "bg-red-200 border-red-500 text-red-900 cursor-default font-bold";
    case "wall":  return "bg-slate-700 border-slate-800 text-white cursor-default";
    default:      return "bg-white border-slate-200 cursor-default";
  }
}

function staticCellIcon(cell: MapCell): string {
  switch (cell.type) {
    case "lane":  return "↔";
    case "entry": return "IN";
    case "exit":  return "OUT";
    case "wall":  return "▪";
    default:      return "";
  }
}

function slotTypeBadge(cell: MapCell): string {
  if (cell.type !== "slot") return "";
  switch (cell.slotType) {
    case "ev":       return "⚡";
    case "vip":      return "★";
    case "disabled": return "♿";
    default:         return "";
  }
}

interface ParkingMapViewProps {
  cells: MapCell[];
  slots: ParkingSlot[];
  activeRecords: Record<string, string>;
  onSlotClick: (slot: ParkingSlot) => void;
}

export function ParkingMapView({ cells, slots, activeRecords, onSlotClick }: ParkingMapViewProps) {
  if (cells.length === 0) return null;

  // ── Build slot lookup ──────────────────────────────────────────────────────
  // Priority 1: explicit slotId FK (set in Map Builder)
  const slotById = new Map<string, ParkingSlot>(slots.map((s) => [s._id, s]));

  // Priority 2: slotNumber match
  const slotByNumber = new Map<string, ParkingSlot>(slots.map((s) => [s.slotNumber, s]));

  // Priority 3: positional fallback — sort slot cells reading-order (row → col),
  // sort ParkingSlots alphabetically by slotNumber, map 1-to-1.
  const slotCells = cells
    .filter((c) => c.type === "slot")
    .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);

  const sortedSlots = [...slots].sort((a, b) =>
    a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
  );

  const slotByPosition = new Map<string, ParkingSlot>();
  slotCells.forEach((cell, idx) => {
    if (idx < sortedSlots.length) {
      slotByPosition.set(`${cell.row},${cell.col}`, sortedSlots[idx]);
    }
  });

  function resolveSlot(cell: MapCell): ParkingSlot | undefined {
    if (cell.slotId)     return slotById.get(cell.slotId);
    if (cell.slotNumber) return slotByNumber.get(cell.slotNumber);
    return slotByPosition.get(`${cell.row},${cell.col}`);
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const containerW = Math.max((maxCol - minCol + 1 + PAD * 2) * STEP + GAP, 400);
  const containerH = Math.max((maxRow - minRow + 1 + PAD * 2) * STEP + GAP, 200);

  return (
    <div className="overflow-auto border border-slate-200 rounded-xl bg-slate-50" style={{ maxHeight: "60vh" }}>
      <div style={{ width: containerW, height: containerH, position: "relative" }}>
        {cells.map((cell) => {
          const { left, top } = pos(cell.row, cell.col, minRow, minCol);

          // Non-slot cells: lane, entry, exit, wall
          if (cell.type !== "slot") {
            return (
              <div
                key={`${cell.row},${cell.col}`}
                style={{ position: "absolute", left, top, width: CELL, height: CELL }}
                className={`border-2 rounded-lg flex flex-col items-center justify-center text-sm font-semibold select-none ${staticCellClass(cell.type)}`}
              >
                <span className="text-base">{staticCellIcon(cell)}</span>
                {cell.label && (
                  <span className="text-[10px] mt-0.5 opacity-70 truncate max-w-[80px] px-1 text-center">{cell.label}</span>
                )}
              </div>
            );
          }

          // Slot cell
          const realSlot = resolveSlot(cell);
          const status = realSlot?.status;
          const isClickable =
            status === SlotStatus.AVAILABLE || status === SlotStatus.OCCUPIED;
          const badge = slotTypeBadge(cell);
          const displayNumber = cell.slotNumber ?? realSlot?.slotNumber;

          return (
            <div
              key={`${cell.row},${cell.col}`}
              onClick={() => {
                if (isClickable && realSlot) onSlotClick(realSlot);
              }}
              style={{ position: "absolute", left, top, width: CELL, height: CELL }}
              className={`border-2 rounded-lg flex flex-col items-center justify-center text-xs font-semibold select-none transition-all relative ${slotStatusClass(status)}`}
              title={
                isClickable
                  ? status === SlotStatus.AVAILABLE
                    ? "Click to record entry"
                    : "Click to record exit"
                  : undefined
              }
            >
              {badge && (
                <span style={{ position: "absolute", top: 4, left: 5, fontSize: 11 }}>{badge}</span>
              )}
              {displayNumber ? (
                <span className="font-mono text-[11px] font-bold leading-tight">{displayNumber}</span>
              ) : (
                <span className="text-base opacity-30">P</span>
              )}
              <span className={`text-[10px] mt-0.5 font-medium ${!status ? "opacity-30" : ""}`}>
                {slotStatusLabel(status)}
              </span>
              {/* Entry/Exit action hint */}
              {isClickable && (
                <span
                  style={{ position: "absolute", bottom: 4, fontSize: 9 }}
                  className="opacity-60 font-medium tracking-tight"
                >
                  {status === SlotStatus.AVAILABLE ? "TAP ENTRY" : "TAP EXIT"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
