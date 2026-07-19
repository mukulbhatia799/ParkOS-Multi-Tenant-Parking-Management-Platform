export interface ParkingLot {
  _id: string;
  clientId: string;
  name: string;
  address?: string;
  geo?: { lat: number; lng: number };
  totalCapacity: number;
  operatingHours?: { open: string; close: string };
  status: "active" | "inactive";
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}
