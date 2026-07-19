import { ZoneType } from "./enums";

export interface ZoneConnection {
  zoneId: string;
  distance: number;
  edgeType: "walkway" | "ramp" | "elevator";
}

export interface ParkingZone {
  _id: string;
  clientId: string;
  lotId: string;
  name: string;
  type: ZoneType;
  parentZoneId?: string | null;
  graphNode?: { x: number; y: number; floor: number };
  connections: ZoneConnection[];
  createdAt: string;
  updatedAt: string;
}
