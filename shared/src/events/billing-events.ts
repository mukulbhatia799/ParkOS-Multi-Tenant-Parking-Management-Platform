export interface FeeCalculatedPayload {
  billingRecordId: string;
  parkingRecordId: string;
  lotId: string;
  licensePlate: string;
  durationMinutes: number;
  amountDue: number;
  currency: string;
}
