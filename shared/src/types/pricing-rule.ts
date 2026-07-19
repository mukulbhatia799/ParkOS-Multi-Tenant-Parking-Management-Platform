export interface PricingRule {
  _id: string;
  clientId: string;
  lotId: string;
  name: string;
  ratePerHour: number;
  currency: string;
  gracePeriodMinutes: number;
  maxDailyCharge?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
