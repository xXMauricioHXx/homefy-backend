import { COLLECTIONS } from "../../../../core/domain/constants/collections";
import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { User } from "../../domain/entities/User";

export class UserRepository {
  constructor(private readonly db: FirestoreClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.db.findById(COLLECTIONS.USERS, id);

    if (!data) {
      return null;
    }

    return User.fromFirestore(data);
  }

  async update(user: User): Promise<void> {
    await this.db
      .getDb()
      .collection(this.db.col(COLLECTIONS.USERS))
      .doc(user.id)
      .update({
        "plan.credits": user.plan.credits,
        updatedAt: new Date().toISOString(),
      });
  }
}
