import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as clientService from "../services/client.service";

export const listClients = asyncHandler(async (_req: Request, res: Response) => {
  const clients = await clientService.listClients();
  res.json(clients);
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.getClient(req.params.clientId);
  res.json(client);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.createClient(req.body);
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.updateClient(req.params.clientId, req.body);
  res.json(client);
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  await clientService.deleteClient(req.params.clientId);
  res.status(204).send();
});
