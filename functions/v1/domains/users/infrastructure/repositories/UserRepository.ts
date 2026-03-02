import { FirestoreClient } from "../../../../core/infrastructure/firestore/FirestoreClient";
import { User } from "../../domain/entities/User";
import { COLLECTIONS } from "../../../../core/domain/constants/collections";
import { Filter } from "firebase-admin/firestore";

export class UserRepository {
  constructor(private readonly db: FirestoreClient) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.findById<Record<string, unknown>>(
      COLLECTIONS.USERS,
      id,
    );
    if (!doc) return null;
    return User.reconstitute(doc);
  }

  async findByUid(uid: string): Promise<User | null> {
    const doc = await this.db.findByField<Record<string, unknown>>(
      COLLECTIONS.USERS,
      "uid",
      uid,
    );
    if (!doc) return null;
    return User.reconstitute(doc);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const doc = await this.db.findByField<Record<string, unknown>>(
      COLLECTIONS.USERS,
      "plan.stripeCustomerId",
      stripeCustomerId,
    );
    if (!doc) return null;
    return User.reconstitute(doc);
  }

  async save(user: User): Promise<void> {
    await this.db.saveWithId(COLLECTIONS.USERS, user.id, user.toFirestore());
  }

  async update(
    id: string,
    data: Partial<ReturnType<User["toFirestore"]>>,
  ): Promise<void> {
    await this.db.update(COLLECTIONS.USERS, id, data);
  }

  async hasWithEmailOrPhone(email: string, phone: string): Promise<boolean> {
    console.log(this.db.col(COLLECTIONS.USERS));
    const snapshot = await this.db
      .getDb()
      .collection(this.db.col(COLLECTIONS.USERS))
      .where(
        Filter.or(
          Filter.where("email", "==", email),
          Filter.where("phone", "==", phone),
        ),
      )
      .get();
    console.log("[INFO] - Snapshot: ", snapshot);

    return !snapshot.empty;
  }
}
