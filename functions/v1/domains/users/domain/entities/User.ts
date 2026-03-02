import { Plan } from "../../../../core/domain/entities/Plan";

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly phone: string,
    readonly plan: Plan,
    readonly createdAt: string,
    readonly updatedAt: string,
    readonly name?: string,
    readonly photoUrl?: string,
  ) {}

  static create(
    id: string,
    email: string,
    phone: string,
    name?: string,
    photoUrl?: string,
  ): User {
    return new User(
      id,
      email,
      phone,
      Plan.free(),
      new Date().toISOString(),
      new Date().toISOString(),
      name,
      photoUrl,
    );
  }

  static reconstitute(data: Record<string, unknown>): User {
    const {
      plan: userPlan,
      id,
      email,
      phone,
      name,
      photoUrl,
      createdAt,
      updatedAt,
    } = data;

    const plan = Plan.fromFirestore(userPlan as Record<string, unknown>);

    return new User(
      id as string,
      email as string,
      phone as string,
      plan,
      createdAt as string,
      updatedAt as string,
      name as string | undefined,
      photoUrl as string | undefined,
    );
  }

  toFirestore(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      name: this.name ?? null,
      photoUrl: this.photoUrl ?? null,
      plan: this.plan.toFirestore(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
