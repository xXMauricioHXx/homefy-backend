export enum PlanType {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  PREMIUM_PLUS = "PREMIUM_PLUS",
}

export interface PlanDefinition {
  planId: PlanType;
  name: string;
  credits: number;
  priceId: string | undefined;
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  [PlanType.FREE]: {
    planId: PlanType.FREE,
    name: "Plano Gratuito",
    credits: 1,
    priceId: undefined,
  },
  [PlanType.BASIC]: {
    planId: PlanType.BASIC,
    name: "Plano Básico",
    credits: 10,
    priceId: process.env.STRIPE_PRICE_ID_BASICO,
  },
  [PlanType.PREMIUM]: {
    planId: PlanType.PREMIUM,
    name: "Plano Premium",
    credits: 20,
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM,
  },
  [PlanType.PREMIUM_PLUS]: {
    planId: PlanType.PREMIUM_PLUS,
    name: "Plano Premium +",
    credits: 40,
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM_PLUS,
  },
};
