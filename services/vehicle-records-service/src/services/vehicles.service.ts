import { VehicleModel, VehicleDocument } from "../models/vehicle.model";
import { ParkingRecordModel } from "../models/parkingRecord.model";
import { AppError } from "../utils/AppError";
import { publishEvent, KafkaTopics } from "../kafka/producer";
import { ParkingRecordStatus, VehicleRegisteredPayload, VehicleType } from "@parking/shared";

export async function listVehicles(clientId: string) {
  return VehicleModel.find({ clientId }).sort({ createdAt: -1 });
}

export async function createVehicle(clientId: string, data: Record<string, unknown>) {
  const licensePlate = (data.licensePlate as string).toUpperCase().trim();

  const existing = await VehicleModel.findOne({ clientId, licensePlate });
  if (existing) throw new AppError(`Vehicle with plate "${licensePlate}" already registered`, 409);

  const vehicle = await VehicleModel.create({ ...data, clientId, licensePlate });

  const payload: VehicleRegisteredPayload = {
    vehicleId: vehicle._id.toString(),
    clientId,
    licensePlate: vehicle.licensePlate,
    type: vehicle.type,
  };
  await publishEvent(KafkaTopics.VEHICLE_REGISTERED, clientId, KafkaTopics.VEHICLE_REGISTERED, payload);

  return vehicle;
}

export async function findOrCreateVehicle(
  clientId: string,
  licensePlate: string,
  vehicleType?: VehicleType
): Promise<VehicleDocument> {
  const plate = licensePlate.toUpperCase().trim();

  let vehicle = await VehicleModel.findOne({ clientId, licensePlate: plate });
  if (vehicle) return vehicle;

  vehicle = await VehicleModel.create({ clientId, licensePlate: plate, type: vehicleType || VehicleType.CAR });

  const payload: VehicleRegisteredPayload = {
    vehicleId: vehicle._id.toString(),
    clientId,
    licensePlate: vehicle.licensePlate,
    type: vehicle.type,
  };
  await publishEvent(KafkaTopics.VEHICLE_REGISTERED, clientId, KafkaTopics.VEHICLE_REGISTERED, payload);

  return vehicle;
}

export async function locateVehicle(clientId: string, licensePlate: string) {
  const plate = licensePlate.toUpperCase().trim();

  const vehicle = await VehicleModel.findOne({ clientId, licensePlate: plate });
  if (!vehicle) throw new AppError(`Vehicle with plate "${plate}" not found`, 404);

  const activeRecord = await ParkingRecordModel.findOne({
    clientId,
    vehicleId: vehicle._id,
    status: ParkingRecordStatus.ACTIVE,
  });

  if (!activeRecord) {
    return { vehicle, parked: false as const };
  }

  return {
    vehicle,
    parked: true as const,
    location: {
      lotId: activeRecord.lotId.toString(),
      zoneId: activeRecord.zoneId.toString(),
      slotId: activeRecord.slotId.toString(),
      slotNumber: activeRecord.slotNumber,
      entryTime: activeRecord.entryTime,
    },
    recordId: activeRecord._id.toString(),
  };
}
