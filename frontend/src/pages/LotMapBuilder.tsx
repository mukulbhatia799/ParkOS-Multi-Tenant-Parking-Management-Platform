import { useEffect, useState } from "react";
import { getLots, getSlots } from "../api/slots.api";
import { listLevels, getLevel, saveLevel, copyLevel, deleteLevel } from "../api/map.api";
import { MapGrid } from "../components/MapGrid";
import { CellType, LevelMeta, LotMapData, MapCell, ParkingLot, ParkingSlot, SlotCellType, SlotType } from "../types";

const ZONE_COLORS = [
  { label: "None", value: "" },
  { label: "Red", value: "#fee2e2" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Green", value: "#dcfce7" },
  { label: "Purple", value: "#f3e8ff" },
  { label: "Orange", value: "#ffedd5" },
  { label: "Pink", value: "#fce7f3" },
];

export function LotMapBuilder() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);

  const [levels, setLevels] = useState<LevelMeta[]>([]);
  const [activeLevel, setActiveLevel] = useState(1);
  const [mapData, setMapData] = useState<LotMapData | null>(null);
  const [cells, setCells] = useState<MapCell[]>([]);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyFromLevel, setCopyFromLevel] = useState<number | "">("");

  const [showAddLevelModal, setShowAddLevelModal] = useState(false);
  const [newLevelNum, setNewLevelNum] = useState<number | "">("");
  const [newLevelName, setNewLevelName] = useState("");

  const [levelName, setLevelName] = useState("");

  // Load lots
  useEffect(() => {
    getLots().then((data) => {
      setLots(data);
      if (data.length > 0) setSelectedLotId(data[0]._id);
    });
  }, []);

  // Load parking slots when lot changes (for the slot picker)
  useEffect(() => {
    if (!selectedLotId) return;
    getSlots(selectedLotId).then(setParkingSlots).catch(() => setParkingSlots([]));
  }, [selectedLotId]);

  // Load levels when lot changes
  useEffect(() => {
    if (!selectedLotId) return;
    listLevels(selectedLotId).then((lvls) => {
      setLevels(lvls);
      if (lvls.length > 0) setActiveLevel(lvls[0].level);
      else setActiveLevel(1);
    });
  }, [selectedLotId]);

  // Load map when active level changes
  useEffect(() => {
    if (!selectedLotId) return;
    setLoading(true);
    setSelectedCell(null);
    getLevel(selectedLotId, activeLevel)
      .then((data) => {
        setMapData(data);
        setCells(data.cells ?? []);
        setLevelName(data.levelName ?? `Level ${activeLevel}`);
      })
      .finally(() => setLoading(false));
  }, [selectedLotId, activeLevel]);

  // ── Cell operations ────────────────────────────────────────────────────────

  function handleAdd(row: number, col: number, count: number) {
    // Determine extension direction from the target cell's neighbors
    const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`));
    const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let dr = 0, dc = 1; // default: extend right

    // If this is the very first cell
    if (cells.length === 0) { dr = 0; dc = 0; }
    else {
      for (const [r, c] of DIRS) {
        const neighborKey = `${row - r},${col - c}`;
        if (cellSet.has(neighborKey)) { dr = r; dc = c; break; }
      }
    }

    const newCells: MapCell[] = [];
    for (let i = 0; i < count; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const key = `${r},${c}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        newCells.push({ row: r, col: c, type: "slot", slotType: "regular" });
      }
    }
    setCells((prev) => [...prev, ...newCells]);
  }

  function handleDelete(row: number, col: number) {
    setCells((prev) => prev.filter((c) => !(c.row === row && c.col === col)));
    if (selectedCell?.row === row && selectedCell?.col === col) setSelectedCell(null);
  }

  function handleCellUpdate(updates: Partial<MapCell>) {
    if (!selectedCell) return;
    setCells((prev) =>
      prev.map((c) =>
        c.row === selectedCell.row && c.col === selectedCell.col ? { ...c, ...updates } : c
      )
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedLotId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveLevel(selectedLotId, activeLevel, cells, levelName);
      // Refresh levels list (cell count may have changed)
      const lvls = await listLevels(selectedLotId);
      setLevels(lvls);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Levels management ──────────────────────────────────────────────────────

  async function handleAddLevel() {
    if (!selectedLotId || newLevelNum === "") return;
    const num = Number(newLevelNum);
    setShowAddLevelModal(false);
    setNewLevelNum("");
    setNewLevelName("");
    // Save empty level then switch to it
    await saveLevel(selectedLotId, num, [], newLevelName || `Level ${num}`);
    const lvls = await listLevels(selectedLotId);
    setLevels(lvls);
    setActiveLevel(num);
  }

  async function handleCopyLevel() {
    if (!selectedLotId || copyFromLevel === "") return;
    setShowCopyModal(false);
    setLoading(true);
    try {
      const data = await copyLevel(selectedLotId, activeLevel, Number(copyFromLevel));
      setCells(data.cells ?? []);
      const lvls = await listLevels(selectedLotId);
      setLevels(lvls);
    } finally {
      setLoading(false);
      setCopyFromLevel("");
    }
  }

  async function handleDeleteLevel(level: number) {
    if (!selectedLotId) return;
    if (!window.confirm(`Delete Level ${level}? This cannot be undone.`)) return;
    await deleteLevel(selectedLotId, level);
    const lvls = await listLevels(selectedLotId);
    setLevels(lvls);
    if (lvls.length > 0) setActiveLevel(lvls[0].level);
    else { setActiveLevel(1); setCells([]); }
  }

  // ── Selected cell data ─────────────────────────────────────────────────────

  const selectedCellData = selectedCell
    ? cells.find((c) => c.row === selectedCell.row && c.col === selectedCell.col) ?? null
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Parking Map Builder</h2>
          {lots.length > 1 && (
            <select
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
              value={selectedLotId ?? ""}
              onChange={(e) => setSelectedLotId(e.target.value)}
            >
              {lots.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          )}
          {lots.length === 1 && <span className="text-sm text-slate-500">{lots[0].name}</span>}
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg === "Saved!" ? "text-status-good" : "text-status-critical"}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save Map"}
          </button>
        </div>
      </div>

      {/* Level tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {levels.map((l) => (
          <div key={l.level} className="flex items-center">
            <button
              onClick={() => setActiveLevel(l.level)}
              className={`px-3 py-1.5 rounded-l-lg border text-sm font-medium transition ${
                activeLevel === l.level
                  ? "bg-accent-500 text-white border-accent-500"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {l.levelName || `Level ${l.level}`}
              <span className="ml-1.5 text-xs opacity-60">({l.cellCount})</span>
            </button>
            <button
              onClick={() => handleDeleteLevel(l.level)}
              className={`px-1.5 py-1.5 rounded-r-lg border-t border-r border-b text-xs transition ${
                activeLevel === l.level
                  ? "bg-accent-600 text-accent-100 border-accent-500 hover:bg-status-critical hover:text-white"
                  : "bg-white text-slate-400 border-slate-200 hover:bg-red-50 hover:text-status-critical"
              }`}
              title="Delete this level"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowAddLevelModal(true)}
          className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50 transition"
        >
          + Level
        </button>
        {levels.length > 1 && (
          <button
            onClick={() => setShowCopyModal(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            Copy from...
          </button>
        )}
      </div>

      {/* Level name inline edit */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Level name:</span>
        <input
          value={levelName}
          onChange={(e) => setLevelName(e.target.value)}
          className="border border-slate-200 rounded-lg px-2 py-0.5 text-sm w-40"
          placeholder={`Level ${activeLevel}`}
        />
      </div>

      {/* Main area: grid + config panel */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 border rounded-xl bg-slate-50">
              <p className="text-slate-400">Loading map...</p>
            </div>
          ) : (
            <MapGrid
              cells={cells}
              selectedCell={selectedCell}
              onSelect={(row, col) =>
                setSelectedCell((prev) =>
                  prev?.row === row && prev?.col === col ? null : { row, col }
                )
              }
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Cell config panel */}
        {selectedCellData && (
          <div className="w-56 border border-slate-200 rounded-xl bg-white shadow-soft p-4 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-800">Cell Config</h4>
              <button onClick={() => setSelectedCell(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-slate-400 font-mono">({selectedCellData.row}, {selectedCellData.col})</p>

            {/* Type */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Cell Type</label>
              <select
                value={selectedCellData.type}
                onChange={(e) => {
                  const t = e.target.value as CellType;
                  handleCellUpdate({ type: t, slotType: t === "slot" ? "regular" : undefined });
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="slot">Parking Slot</option>
                <option value="lane">Lane / Road</option>
                <option value="entry">Entry Gate</option>
                <option value="exit">Exit Gate</option>
                <option value="wall">Wall / Pillar</option>
              </select>
            </div>

            {/* Slot type */}
            {selectedCellData.type === "slot" && (
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Slot Type</label>
                <select
                  value={selectedCellData.slotType ?? "regular"}
                  onChange={(e) => handleCellUpdate({ slotType: e.target.value as SlotCellType })}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="regular">Regular (P)</option>
                  <option value="ev">EV Charging (⚡)</option>
                  <option value="vip">VIP (★)</option>
                  <option value="disabled">Disabled (♿)</option>
                </select>
              </div>
            )}

            {/* Slot picker — links this cell to a real ParkingSlot record */}
            {selectedCellData.type === "slot" && (
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Link to Slot
                  {selectedCellData.slotId && (
                    <span className="ml-1 text-green-600 font-semibold">●</span>
                  )}
                </label>
                <select
                  value={selectedCellData.slotId ?? ""}
                  onChange={(e) => {
                    const slotId = e.target.value;
                    if (!slotId) {
                      handleCellUpdate({ slotId: undefined, slotNumber: undefined });
                      return;
                    }
                    const slot = parkingSlots.find((s) => s._id === slotId);
                    if (!slot) return;
                    const slotTypeMap: Record<SlotType, SlotCellType> = {
                      [SlotType.REGULAR]:   "regular",
                      [SlotType.VIP]:       "vip",
                      [SlotType.EV]:        "ev",
                      [SlotType.DISABLED]:  "disabled",
                      [SlotType.RESERVED]:  "regular",
                    };
                    handleCellUpdate({
                      slotId:     slot._id,
                      slotNumber: slot.slotNumber,
                      slotType:   slotTypeMap[slot.type] ?? "regular",
                    });
                  }}
                  className="w-full border rounded px-2 py-1 text-sm font-mono"
                >
                  <option value="">— unlinked —</option>
                  {parkingSlots.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.slotNumber} ({s.type})
                    </option>
                  ))}
                </select>
                {selectedCellData.slotId && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                    id: {selectedCellData.slotId}
                  </p>
                )}
              </div>
            )}

            {/* Label (for non-slot cells) */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Label</label>
              <input
                value={selectedCellData.label ?? ""}
                onChange={(e) => handleCellUpdate({ label: e.target.value })}
                placeholder="Optional label"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Zone color */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Zone Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {ZONE_COLORS.map((z) => (
                  <button
                    key={z.value}
                    onClick={() => handleCellUpdate({ zoneColor: z.value })}
                    title={z.label}
                    className={`w-6 h-6 rounded border-2 transition ${
                      (selectedCellData.zoneColor ?? "") === z.value
                        ? "border-slate-800 scale-110"
                        : "border-transparent hover:border-slate-300"
                    }`}
                    style={{ backgroundColor: z.value || "#f1f5f9" }}
                  />
                ))}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                handleDelete(selectedCellData.row, selectedCellData.col);
                setSelectedCell(null);
              }}
              className="w-full py-1.5 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition font-medium"
            >
              Delete Cell
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
        <span className="font-medium">Legend:</span>
        {[
          { bg: "bg-white border border-slate-300", label: "P Regular" },
          { bg: "bg-green-100 border border-green-400", label: "⚡ EV" },
          { bg: "bg-yellow-100 border border-yellow-400", label: "★ VIP" },
          { bg: "bg-blue-100 border border-blue-400", label: "♿ Disabled" },
          { bg: "bg-amber-50 border border-amber-200", label: "↔ Lane" },
          { bg: "bg-green-200 border border-green-500", label: "IN Entry" },
          { bg: "bg-red-200 border border-red-500", label: "OUT Exit" },
          { bg: "bg-slate-700", label: "▪ Wall" },
        ].map(({ bg, label }) => (
          <span key={label} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${bg}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Add Level Modal */}
      {showAddLevelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-softLg p-6 w-80 space-y-4">
            <h3 className="font-semibold text-slate-800">Add Level</h3>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Level Number</label>
              <input
                type="number" min={1}
                value={newLevelNum}
                onChange={(e) => setNewLevelNum(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 2"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Level Name (optional)</label>
              <input
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="e.g. Ground Floor"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddLevelModal(false); setNewLevelNum(""); setNewLevelName(""); }}
                className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleAddLevel} disabled={newLevelNum === ""}
                className="flex-1 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy from Level Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-softLg p-6 w-80 space-y-4">
            <h3 className="font-semibold text-slate-800">Copy Map from Level</h3>
            <p className="text-sm text-slate-500">
              This will replace all cells on <strong>Level {activeLevel}</strong> with the selected level's layout.
            </p>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Copy from</label>
              <select
                value={copyFromLevel}
                onChange={(e) => setCopyFromLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">Select level...</option>
                {levels.filter((l) => l.level !== activeLevel).map((l) => (
                  <option key={l.level} value={l.level}>
                    {l.levelName || `Level ${l.level}`} ({l.cellCount} cells)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowCopyModal(false); setCopyFromLevel(""); }}
                className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleCopyLevel} disabled={copyFromLevel === ""}
                className="flex-1 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 disabled:opacity-50">Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
