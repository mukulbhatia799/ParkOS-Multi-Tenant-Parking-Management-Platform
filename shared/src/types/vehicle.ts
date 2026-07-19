import { VehicleType } from "./enums";

export interface Vehicle {
  _id: string;
  clientId: string;
  licensePlate: string;
  type: VehicleType;
  ownerName?: string;
  ownerContact?: string;
  createdAt: string;
  updatedAt: string;
}
