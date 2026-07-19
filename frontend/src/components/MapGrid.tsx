import { useEffect, useRef, useState } from "react";
import { CellType, MapCell, SlotCellType } from "../types";

const CELL = 88;
const GAP  = 8;
const STEP = CELL + GAP;
const PAD  = 2;

// ── Cell appearance ────────────────────────────────────────────────────────────

const SLOT_STYLES: Record<SlotCellType, string> = {
  regular:  "bg-white border-slate-300 text-slate-700",
  ev:       "bg-green-100 border-green-400 text-green-800",
  vip:      "bg-yellow-100 border-yellow-400 text-yellow-800",
  disabled: "bg-blue-100 border-blue-400 text-blue-800",
};

const STATIC_STYLES: Record<Exclude<CellType, "slot">, string> = {
  lane:  "bg-amber-50 border-amber-200 text-amber-700",
  entry: "bg-green-200 border-green-500 text-green-900",
  exit:  "bg-red-200 border-red-500 text-red-900",
  wall:  "bg-slate-700 border-slate-800 text-white",
};

function cellClass(cell: MapCell, selected: boolean): string {
  const base =
    cell.type === "slot"
      ? SLOT_STYLES[cell.slotType ?? "regular"]
      : STATIC_STYLES[cell.type as Exclude<CellType, "slot">];
  return `${base}${selected ? " ring-2 ring-accent-500 ring-offset-1" : ""}`;
}

function cellIcon(cell: MapCell): string {
  if (cell.type === "lane")  return "↔";
  if (cell.type === "entry") return "IN";
  if (cell.type === "exit")  return "OUT";
  if (cell.type === "wall")  return "▪";
  const icons: Record<SlotCellType, string> = {
    regular: "P",
    ev:       "⚡",
    vip:      "★",
    disabled: "♿",
  };
  return icons[cell.slotType ?? "regular"];
}

// ── Add-cells popover ──────────────────────────────────────────────────────────

interface AddPopoverProps {
  style: React.CSSProperties;
  onConfirm: (count: number) => void;
  onClose: () => void;
}

function AddPopover({ style, onConfirm, onClose }: AddPopoverProps) {
  const [count, setCount] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ ...style, position: "absolute", zIndex: 30, minWidth: 160 }}
      className="bg-white border border-slate-200 rounded-xl shadow-softLg p-3 flex flex-col gap-2"
    >
      <p className="text-xs font-medium text-slate-500">How many cells?</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-slate-100"
        >−</button>
        <input
          type="number" min={1} max={30} value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value))))}
          className="w-12 border rounded px-1 py-0.5 text-sm text-center"
        />
        <button
          onClick={() => setCount((c) => Math.min(30, c + 1))}
          className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-slate-100"
        >+</button>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => { onConfirm(count); onClose(); }}
          className="flex-1 py-1 bg-accent-500 text-white rounded-lg text-xs font-medium hover:bg-accent-600"
        >
          Add {count}
        </button>
        <button onClick={onClose} className="px-2 py-1 border rounded-lg text-xs hover:bg-slate-50">✕</button>
      </div>
    </div>
  );
}

// ── MapGrid ────────────────────────────────────────────────────────────────────

export interface MapGridProps {
  cells: MapCell[];
  selectedCell: { row: number; col: number } | null;
  onSelect: (row: number, col: number) => void;
  onAdd: (row: number, col: number, count: number) => void;
  onDelete: (row: number, col: number) => void;
}

export function MapGrid({ cells, selectedCell, onSelect, onAdd, onDelete }: MapGridProps) {
  const [popover, setPopover] = useState<{
    targetRow: number;
    targetCol: number;
    x: number;
    y: number;
  } | null>(null);

  const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`));

  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  const minRow = cells.length ? Math.min(...rows) : 0;
  const maxRow = cells.length ? Math.max(...rows) : 0;
  const minCol = cells.length ? Math.min(...cols) : 0;
  const maxCol = cells.length ? Math.max(...cols) : 0;

  const containerW = Math.max((maxCol - minCol + 1 + PAD * 2) * STEP + GAP, 400);
  const containerH = Math.max((maxRow - minRow + 1 + PAD * 2) * STEP + GAP, 300);

  function cellPos(row: number, col: number) {
    return {
      left: (col - minCol + PAD) * STEP + GAP / 2,
      top:  (row - minRow + PAD) * STEP + GAP / 2,
    };
  }

  // Collect all adjacent-empty positions (deduplicated)
  const adjacentEmpty = new Map<string, { row: number; col: number }>();
  const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const cell of cells) {
    for (const [dr, dc] of DIRS) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      const key = `${nr},${nc}`;
      if (!cellSet.has(key)) adjacentEmpty.set(key, { row: nr, col: nc });
    }
  }

  function openPopover(row: number, col: number, e: React.MouseEvent) {
    e.stopPropagation();
    const { left, top } = cellPos(row, col);
    setPopover({ targetRow: row, targetCol: col, x: left, y: top });
  }

  function handleAdd(count: number) {
    if (!popover) return;
    const { targetRow, targetCol } = popover;

    // Determine extension direction from which existing cell borders this empty target
    let dr = 0, dc = 1; // default: extend right
    for (const [r, c] of DIRS) {
      if (cellSet.has(`${targetRow - r},${targetCol - c}`)) {
        dr = r; dc = c; break;
      }
    }

    // Place count cells starting at target, extending in the detected direction
    for (let i = 0; i < count; i++) {
      const r = targetRow + dr * i;
      const c = targetCol + dc * i;
      if (!cellSet.has(`${r},${c}`)) {
        cellSet.add(`${r},${c}`); // prevent duplicates within this batch
        onAdd(r, c, 1);
      }
    }
  }

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-slate-400 text-sm">No cells yet. Start building your parking map.</p>
          <button
            onClick={() => onAdd(0, 0, 1)}
            className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition text-sm"
          >
            + Add First Cell
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-slate-200 rounded-xl bg-slate-50 relative" style={{ maxHeight: "60vh" }}>
      <div style={{ width: containerW, height: containerH, position: "relative" }}>

        {/* Existing cells */}
        {cells.map((cell) => {
          const { left, top } = cellPos(cell.row, cell.col);
          const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
          return (
            <div
              key={`${cell.row},${cell.col}`}
              onClick={() => onSelect(cell.row, cell.col)}
              style={{ position: "absolute", left, top, width: CELL, height: CELL }}
              className={`group border-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-sm font-semibold select-none transition-all relative ${cellClass(cell, isSelected)}`}
            >
              <span className="text-base leading-none">{cellIcon(cell)}</span>
              {cell.slotNumber && (
                <span className="text-[10px] mt-1 font-mono opacity-70">{cell.slotNumber}</span>
              )}
              {cell.label && cell.type !== "slot" && (
                <span className="text-[10px] mt-0.5 opacity-70 truncate max-w-[80px] px-1 text-center">{cell.label}</span>
              )}
              {/* Linked slot indicator */}
              {cell.type === "slot" && cell.slotId && (
                <span style={{ position: "absolute", top: 3, left: 4, fontSize: 9 }} className="text-green-600 font-bold">●</span>
              )}
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(cell.row, cell.col); }}
                style={{ position: "absolute", top: 3, right: 3 }}
                className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
                title="Delete cell"
              >×</button>
            </div>
          );
        })}

        {/* "+" buttons at adjacent empty positions */}
        {Array.from(adjacentEmpty.values()).map(({ row, col }) => {
          const { left, top } = cellPos(row, col);
          return (
            <button
              key={`add-${row},${col}`}
              onClick={(e) => openPopover(row, col, e)}
              style={{
                position: "absolute",
                left: left + CELL / 2 - 12,
                top:  top  + CELL / 2 - 12,
                width: 24,
                height: 24,
              }}
              className="rounded-full bg-accent-500 hover:bg-accent-600 text-white text-base font-bold shadow-md flex items-center justify-center z-10 transition-colors"
              title="Add cell here"
            >+</button>
          );
        })}

        {/* Add-count popover */}
        {popover && (
          <AddPopover
            style={{ left: popover.x + CELL / 2 + 8, top: popover.y - 8 }}
            onConfirm={handleAdd}
            onClose={() => setPopover(null)}
          />
        )}
      </div>
    </div>
  );
}
