import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId, operatorLotScope } from "../middleware/tenantScope";
import * as slotsService from "../services/slots.service";
import * as slotAssignmentService from "../services/slotAssignment.service";

export const listSlots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  operatorLotScope(req, req.params.lotId);

  const { status, type, zoneId } = req.query;
  const slots = await slotsService.listSlots(clientId, req.params.lotId, {
    status: status as string | undefined,
    type: type as string | undefined,
    zoneId: zoneId as string | undefined,
  });
  res.json(slots);
});

export const createSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;

  if (Array.isArray(req.body.slots)) {
    const slots = await slotsService.bulkCreateSlots(clientId, req.params.lotId, req.body.slots);
    return res.status(201).json(slots);
  }

  const slot = await slotsService.createSlot(clientId, req.params.lotId, req.body);
  res.status(201).json(slot);
});

export const getSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const slot = await slotsService.getSlotById(clientId, req.params.slotId);
  res.json(slot);
});

export const updateSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const slot = await slotsService.updateSlot(clientId, req.params.slotId, req.body);
  res.json(slot);
});

export const deleteSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  await slotsService.deleteSlot(clientId, req.params.slotId);
  res.status(204).send();
});

export const assignSlot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const { lotId, vehicleType, entryZoneId } = req.body;
  if (!lotId) return res.status(400).json({ error: "lotId is required" });
  const slot = await slotAssignmentService.assignSlot(clientId, lotId, vehicleType, entryZoneId);
  res.json({ slot });
});
