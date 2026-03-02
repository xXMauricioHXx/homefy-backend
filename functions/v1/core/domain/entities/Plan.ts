import { PlanStatus } from "../constants/planStatus";
import { PLANS, PlanType } from "../constants/plan";
import { nowFrom1Month } from "../../../shared/utils/date";

export class Plan {
  private constructor(
    public name: PlanType,
    public credits: number,
    public stripeCustomerId: string,
    public stripeSubscriptionId: string,
    public stripePriceId: string,

    public expiresAt: string | null,
    public status: PlanStatus,
  ) {}

  static free(): Plan {
    const definition = PLANS[PlanType.FREE];

    return new Plan(
      definition.planId,
      definition.credits,
      "",
      "",
      "",
      nowFrom1Month().toISOString(),
      PlanStatus.ACTIVE,
    );
  }

  static basic(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
  ): Plan {
    const definition = PLANS[PlanType.BASIC];

    return new Plan(
      definition.planId,
      definition.credits,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      nowFrom1Month().toISOString(),
      PlanStatus.ACTIVE,
    );
  }

  static premium(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
  ): Plan {
    const definition = PLANS[PlanType.PREMIUM];

    return new Plan(
      definition.planId,
      definition.credits,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      nowFrom1Month().toISOString(),
      PlanStatus.ACTIVE,
    );
  }

  static premiumPlus(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
  ): Plan {
    const definition = PLANS[PlanType.PREMIUM_PLUS];

    return new Plan(
      definition.planId,
      definition.credits,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      nowFrom1Month().toISOString(),
      PlanStatus.ACTIVE,
    );
  }

  static create(
    name: PlanType,
    credits: number,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    expiresAt: string,
    status: PlanStatus,
  ): Plan {
    return new Plan(
      name,
      credits,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      expiresAt,
      status,
    );
  }

  static fromFirestore(data: Record<string, unknown>): Plan {
    const {
      name,
      credits,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      expiresAt,
      status,
    } = data;

    return new Plan(
      name as PlanType,
      credits as number,
      stripeCustomerId as string,
      stripeSubscriptionId as string,
      stripePriceId as string,
      expiresAt as string,
      status as PlanStatus,
    );
  }

  setStripeData(
    name: PlanType,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
  ) {
    this.name = name;
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.stripePriceId = stripePriceId;
  }

  toFirestore(): Record<string, unknown> {
    return {
      name: this.name,
      credits: this.credits,
      stripeCustomerId: this.stripeCustomerId,
      stripeSubscriptionId: this.stripeSubscriptionId,
      stripePriceId: this.stripePriceId,
      expiresAt: this.expiresAt,
      status: this.status,
    };
  }
}
