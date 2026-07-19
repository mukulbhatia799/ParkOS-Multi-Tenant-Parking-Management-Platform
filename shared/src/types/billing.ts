export interface BillingRecord {
  _id: string;
  clientId: string;
  parkingRecordId: string;
  lotId: string;
  licensePlate: string;
  durationMinutes: number;
  amountDue: number;
  currency: string;
  pricingRuleId?: string;
  calculatedAt: string;
  createdAt: string;
}
