import { Schema, model, Document, Types } from "mongoose";

export type CellType = "slot" | "lane" | "entry" | "exit" | "wall";
export type SlotCellType = "regular" | "ev" | "vip" | "disabled";

export interface MapCell {
  row: number;
  col: number;
  type: CellType;
  slotType?: SlotCellType;
  slotId?: string;      // FK → ParkingSlot._id (explicit link; takes priority over slotNumber)
  slotNumber?: string;  // display label; auto-filled when slotId is selected
  label?: string;
  zoneColor?: string;
}

export interface LotMapDocument extends Document {
  clientId: Types.ObjectId;
  lotId: Types.ObjectId;
  level: number;
  levelName?: string;
  cells: MapCell[];
  createdAt: Date;
  updatedAt: Date;
}

const mapCellSchema = new Schema<MapCell>(
  {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: { type: String, enum: ["slot", "lane", "entry", "exit", "wall"], required: true },
    slotType: { type: String, enum: ["regular", "ev", "vip", "disabled"] },
    slotId: { type: String },
    slotNumber: { type: String },
    label: { type: String },
    zoneColor: { type: String },
  },
  { _id: false }
);

const lotMapSchema = new Schema<LotMapDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    level: { type: Number, required: true, min: 1 },
    levelName: { type: String },
    cells: { type: [mapCellSchema], default: [] },
  },
  { timestamps: true }
);

lotMapSchema.index({ clientId: 1, lotId: 1 });
lotMapSchema.index({ lotId: 1, level: 1 }, { unique: true });

export const LotMapModel = model<LotMapDocument>("LotMap", lotMapSchema);
