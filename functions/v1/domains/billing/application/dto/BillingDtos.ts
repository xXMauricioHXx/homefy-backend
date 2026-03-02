import { PlanType } from "../../../../core/domain/constants/plan";

export interface CheckoutSessionCompletedDto {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: PlanType;
  stripePriceId: string;
}

export interface InvoicePaidDto {
  stripeCustomerId: string;
  billingReason: string;
}
