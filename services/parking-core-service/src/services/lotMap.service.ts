import { Types } from "mongoose";
import { LotMapModel, MapCell } from "../models/lotMap.model";
import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";

async function verifyLotOwnership(clientId: string, lotId: string) {
  const filter: Record<string, unknown> = { _id: new Types.ObjectId(lotId) };
  if (clientId) filter.clientId = new Types.ObjectId(clientId);
  const lot = await ParkingLotModel.findOne(filter);
  if (!lot) throw new AppError("Lot not found", 404);
  return lot;
}

export async function listLevels(clientId: string, lotId: string) {
  await verifyLotOwnership(clientId, lotId);
  const levels = await LotMapModel.aggregate([
    {
      $match: {
        clientId: new Types.ObjectId(clientId),
        lotId: new Types.ObjectId(lotId),
      },
    },
    {
      $project: {
        level: 1,
        levelName: 1,
        cellCount: { $size: "$cells" },
        updatedAt: 1,
      },
    },
    { $sort: { level: 1 } },
  ]);
  return levels;
}

export async function getLevel(clientId: string, lotId: string, level: number) {
  await verifyLotOwnership(clientId, lotId);
  const map = await LotMapModel.findOne({
    clientId: new Types.ObjectId(clientId),
    lotId: new Types.ObjectId(lotId),
    level,
  });
  if (!map) return { level, levelName: `Level ${level}`, cells: [] };
  return map;
}

export async function saveLevel(
  clientId: string,
  lotId: string,
  level: number,
  cells: MapCell[],
  levelName?: string
) {
  await verifyLotOwnership(clientId, lotId);
  const map = await LotMapModel.findOneAndUpdate(
    {
      clientId: new Types.ObjectId(clientId),
      lotId: new Types.ObjectId(lotId),
      level,
    },
    {
      $set: {
        cells,
        ...(levelName !== undefined ? { levelName } : {}),
        clientId: new Types.ObjectId(clientId),
        lotId: new Types.ObjectId(lotId),
        level,
      },
    },
    { upsert: true, new: true }
  );
  return map;
}

export async function copyLevel(
  clientId: string,
  lotId: string,
  toLevel: number,
  fromLevel: number
) {
  await verifyLotOwnership(clientId, lotId);
  const source = await LotMapModel.findOne({
    clientId: new Types.ObjectId(clientId),
    lotId: new Types.ObjectId(lotId),
    level: fromLevel,
  });
  if (!source) throw new AppError(`Level ${fromLevel} has no saved map`, 404);

  const cellsCopy: MapCell[] = source.cells.map((c) => ({
    row: c.row,
    col: c.col,
    type: c.type,
    ...(c.slotType ? { slotType: c.slotType } : {}),
    ...(c.slotNumber ? { slotNumber: c.slotNumber } : {}),
    ...(c.label ? { label: c.label } : {}),
    ...(c.zoneColor ? { zoneColor: c.zoneColor } : {}),
  }));

  return saveLevel(clientId, lotId, toLevel, cellsCopy);
}

export async function deleteLevel(clientId: string, lotId: string, level: number) {
  await verifyLotOwnership(clientId, lotId);
  await LotMapModel.deleteOne({
    clientId: new Types.ObjectId(clientId),
    lotId: new Types.ObjectId(lotId),
    level,
  });
}
