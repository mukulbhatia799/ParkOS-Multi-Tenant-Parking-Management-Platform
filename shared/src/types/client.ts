import { ClientStatus, SubscriptionPlan } from "./enums";

export interface Client {
  _id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  subscriptionPlan: SubscriptionPlan;
  status: ClientStatus;
  settings: {
    timezone: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}
