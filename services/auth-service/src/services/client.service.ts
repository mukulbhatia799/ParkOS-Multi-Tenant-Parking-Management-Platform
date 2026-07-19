import { ClientModel } from "../models/client.model";
import { AppError } from "../utils/AppError";
import { publishEvent, KafkaTopics } from "../kafka/producer";

export async function listClients() {
  return ClientModel.find().sort({ createdAt: -1 });
}

export async function getClient(clientId: string) {
  const client = await ClientModel.findById(clientId);
  if (!client) throw new AppError("Client not found", 404);
  return client;
}

export async function createClient(data: Record<string, unknown>) {
  const existing = await ClientModel.findOne({ slug: data.slug });
  if (existing) throw new AppError("Client slug already in use", 409);

  const client = await ClientModel.create(data);
  await publishEvent(KafkaTopics.CLIENT_CREATED, client._id.toString(), KafkaTopics.CLIENT_CREATED, {
    clientId: client._id.toString(),
    name: client.name,
    slug: client.slug,
  });
  return client;
}

export async function updateClient(clientId: string, data: Record<string, unknown>) {
  const client = await ClientModel.findByIdAndUpdate(clientId, data, { new: true });
  if (!client) throw new AppError("Client not found", 404);
  return client;
}

export async function deleteClient(clientId: string) {
  const client = await ClientModel.findByIdAndDelete(clientId);
  if (!client) throw new AppError("Client not found", 404);
  return client;
}
