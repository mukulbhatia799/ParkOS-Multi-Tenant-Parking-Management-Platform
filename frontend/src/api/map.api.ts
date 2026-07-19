import { apiClient } from "./client";
import { LevelMeta, LotMapData, MapCell } from "../types";

export async function listLevels(lotId: string): Promise<LevelMeta[]> {
  const res = await apiClient.get(`/lots/${lotId}/map`);
  return res.data;
}

export async function getLevel(lotId: string, level: number): Promise<LotMapData> {
  const res = await apiClient.get(`/lots/${lotId}/map/${level}`);
  return res.data;
}

export async function saveLevel(
  lotId: string,
  level: number,
  cells: MapCell[],
  levelName?: string
): Promise<LotMapData> {
  const res = await apiClient.put(`/lots/${lotId}/map/${level}`, { cells, levelName });
  return res.data;
}

export async function copyLevel(
  lotId: string,
  toLevel: number,
  fromLevel: number
): Promise<LotMapData> {
  const res = await apiClient.post(`/lots/${lotId}/map/${toLevel}/copy`, { fromLevel });
  return res.data;
}

export async function deleteLevel(lotId: string, level: number): Promise<void> {
  await apiClient.delete(`/lots/${lotId}/map/${level}`);
}
