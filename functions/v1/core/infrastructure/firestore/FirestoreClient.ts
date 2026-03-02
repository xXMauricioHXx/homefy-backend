import {
  getFirestore,
  Firestore,
  DocumentData,
  Query,
} from "firebase-admin/firestore";

export class FirestoreClient {
  private static instance: FirestoreClient;
  private readonly db: Firestore;
  private readonly envSuffix: string;

  private constructor() {
    this.db = getFirestore();
    this.envSuffix = process.env.NODE_ENV === "development" ? "-dev" : "";
  }

  public static getInstance(): FirestoreClient {
    if (!FirestoreClient.instance) {
      FirestoreClient.instance = new FirestoreClient();
    }
    return FirestoreClient.instance;
  }

  public col(name: string): string {
    return `${name}${this.envSuffix}`;
  }

  async save<T extends DocumentData>(
    collection: string,
    data: T,
  ): Promise<string> {
    const ref = await this.db.collection(this.col(collection)).add(data);
    return ref.id;
  }

  async saveWithId<T extends DocumentData>(
    collection: string,
    id: string,
    data: T,
  ): Promise<string> {
    await this.db.collection(this.col(collection)).doc(id).set(data);
    return id;
  }

  async saveToSubCollection<T extends DocumentData>(
    collection: string,
    parentId: string,
    subCollection: string,
    id: string,
    data: T,
  ): Promise<string> {
    await this.db
      .collection(this.col(collection))
      .doc(parentId)
      .collection(subCollection)
      .doc(id)
      .set(data);
    return id;
  }

  async findById<T>(
    collection: string,
    id: string,
  ): Promise<(T & { id: string }) | null> {
    const doc = await this.db.collection(this.col(collection)).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as T) };
  }

  async findFromSubCollection<T>(
    collection: string,
    parentId: string,
    subCollection: string,
    id: string,
  ): Promise<(T & { id: string }) | null> {
    const doc = await this.db
      .collection(this.col(collection))
      .doc(parentId)
      .collection(subCollection)
      .doc(id)
      .get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as T) };
  }

  async listSubCollection<T>(
    collection: string,
    parentId: string,
    subCollection: string,
  ): Promise<(T & { id: string })[]> {
    const snapshot = await this.db
      .collection(this.col(collection))
      .doc(parentId)
      .collection(subCollection)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) }));
  }

  async update<T extends DocumentData>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<void> {
    await this.db
      .collection(this.col(collection))
      .doc(id)
      .update({ ...data, updatedAt: new Date().toISOString() });
  }

  async findByField<T>(
    collection: string,
    field: string,
    value: unknown,
  ): Promise<(T & { id: string }) | null> {
    const snapshot = await (
      this.db
        .collection(this.col(collection))
        .where(field, "==", value) as Query
    )
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as T) };
  }

  async findManyByField<T>(
    collection: string,
    field: string,
    value: unknown,
  ): Promise<(T & { id: string })[]> {
    const snapshot = await this.db
      .collection(this.col(collection))
      .where(field, "==", value)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) }));
  }

  /**
   * Upsert a document using set with merge:true — creates if absent, merges if present.
   */
  async setWithMerge<T extends DocumentData>(
    collection: string,
    id: string,
    data: T,
  ): Promise<void> {
    await this.db
      .collection(this.col(collection))
      .doc(id)
      .set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }

  /**
   * Find all documents where `field` is a date/ISO-string strictly before `date`.
   */
  async findManyBeforeDate<T>(
    collection: string,
    field: string,
    date: Date,
  ): Promise<(T & { id: string })[]> {
    const snapshot = await this.db
      .collection(this.col(collection))
      .where(field, "<", date)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) }));
  }

  getDb(): Firestore {
    return this.db;
  }
}
