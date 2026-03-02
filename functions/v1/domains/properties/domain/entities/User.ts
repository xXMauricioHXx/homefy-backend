import { PlanStatus } from "../../../../core/domain/constants/planStatus";
import { NoCreditsAvailableException } from "../exceptions/NoCredistAvailable";

export interface UserPlan {
  name: string;
  credits: number;
  readonly expiresAt: string | null;
  readonly status: PlanStatus;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly plan: UserPlan,
    public readonly createdAt: string,
    public updatedAt: string,
  ) {}

  useCredit(): void {
    if (this.plan.credits <= 0) {
      throw new NoCreditsAvailableException();
    }

    this.plan.credits--;
    this.updatedAt = new Date().toISOString();
  }

  hasCredits(): boolean {
    return this.plan.credits > 0;
  }

  static fromFirestore(data: Partial<User>): User {
    return new User(
      data.id as string,
      data.name as string,
      {
        name: data.plan?.name || "",
        credits: data.plan?.credits || 0,
        expiresAt: data.plan?.expiresAt || "",
        status: data.plan?.status || PlanStatus.INACTIVE,
      },
      data.createdAt as string,
      data.updatedAt as string,
    );
  }
}
