import { COLLECTIONS } from "../../../../core/domain/constants/collections";
import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { User } from "../../domain/entities/User";

export class UserRepository {
  constructor(private readonly db: FirestoreClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.db.findById<Record<string, unknown>>(
      COLLECTIONS.USERS,
      id,
    );

    if (!data) return null;

    return User.reconstitute(data);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const data = await this.db.findByField<Record<string, unknown>>(
      COLLECTIONS.USERS,
      "plan.stripeCustomerId",
      stripeCustomerId,
    );

    if (!data) return null;

    return User.reconstitute(data);
  }

  async findExpiredSubscriptions(): Promise<User[]> {
    const now = new Date();
    const records = await this.db.findManyBeforeDate<Record<string, unknown>>(
      COLLECTIONS.USERS,
      "plan.expiresAt",
      now,
    );

    return records.map((r) => User.reconstitute(r));
  }

  async save(user: User): Promise<void> {
    await this.db.setWithMerge<Record<string, unknown>>(
      COLLECTIONS.USERS,
      user.id,
      user.toFirestore(),
    );
  }
}
