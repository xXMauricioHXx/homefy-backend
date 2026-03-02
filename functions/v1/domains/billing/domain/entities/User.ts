import { Plan } from "../../../../core/domain/entities/Plan";
import { PlanType } from "../../../../core/domain/constants/plan";

export class User {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public updatedAt: string,
    public plan: Plan,
  ) {}

  setPlan(planType: PlanType): void {
    switch (planType) {
      case PlanType.FREE:
        this.plan = Plan.free();
        break;
      case PlanType.BASIC:
        this.plan = Plan.basic(
          this.plan.stripeCustomerId,
          this.plan.stripeSubscriptionId,
          this.plan.stripePriceId,
        );
        break;
      case PlanType.PREMIUM:
        this.plan = Plan.premium(
          this.plan.stripeCustomerId,
          this.plan.stripeSubscriptionId,
          this.plan.stripePriceId,
        );
        break;
      case PlanType.PREMIUM_PLUS:
        this.plan = Plan.premiumPlus(
          this.plan.stripeCustomerId,
          this.plan.stripeSubscriptionId,
          this.plan.stripePriceId,
        );
        break;
    }
  }

  cancelPlan(): void {
    const free = Plan.free();
    this.plan = Plan.create(
      free.name,
      this.plan.credits,
      "",
      "",
      "",
      free.expiresAt as string,
      free.status,
    );

    this.updatedAt = new Date().toISOString();
  }

  expirePlan(): void {
    this.plan = Plan.free();
    this.updatedAt = new Date().toISOString();
  }

  useCredit(): void {
    if (this.plan.credits <= 0) {
      throw new Error("No credits available");
    }

    this.plan.credits--;
    this.updatedAt = new Date().toISOString();
  }

  hasCredits(): boolean {
    return this.plan.credits > 0;
  }

  getStripeCustomerId(): string | null {
    return this.plan.stripeCustomerId;
  }

  toFirestore(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      updatedAt: this.updatedAt,
      plan: this.plan.toFirestore(),
    };
  }

  static reconstitute(data: Record<string, unknown>): User {
    return new User(
      data.id as string,
      data.name as string,
      data.updatedAt as string,
      Plan.fromFirestore(data.plan as Record<string, unknown>),
    );
  }
}
