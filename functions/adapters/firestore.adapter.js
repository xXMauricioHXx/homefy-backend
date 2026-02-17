const { getFirestore } = require("firebase-admin/firestore");

class FirestoreAdapter {
  constructor() {
    this.db = getFirestore();
    this.environment = process.env.NODE_ENV == "development" ? "-dev" : "";
  }

  replaceCollectionName(collectionName) {
    return collectionName + this.environment;
  }

  async save(collectionName, data) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const docRef = await this.db.collection(replacedCollectionName).add(data);
      console.log(
        `[INFO] - Document saved to ${collectionName} with ID: ${docRef.id}`,
      );
      return docRef.id;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to save document to ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async saveWithId(collectionName, id, data) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const docRef = this.db.collection(replacedCollectionName).doc(id);
      await docRef.set(data);
      console.log(
        `[INFO] - Document saved to ${replacedCollectionName} with ID: ${id}`,
      );

      return id;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to save document to ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async findById(collectionName, id) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const docRef = this.db.collection(replacedCollectionName).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error(
        `[ERROR] - Failed to find document in ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async update(collectionName, id, data) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const docRef = this.db.collection(replacedCollectionName).doc(id);
      await docRef.update({
        ...data,
        updatedAt: new Date(),
      });
      console.log(
        `[INFO] - Document updated in ${collectionName} with ID: ${id}`,
      );
      return id;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to update document in ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async setWithMerge(collectionName, id, data) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const docRef = this.db.collection(replacedCollectionName).doc(id);
      await docRef.set(
        {
          ...data,
          updatedAt: new Date(),
        },
        { merge: true },
      );
      console.log(
        `[INFO] - Document set/merged in ${collectionName} with ID: ${id}`,
      );
      return id;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to set/merge document in ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async findByUserId(collectionName, userId) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);

      const snapshot = await this.db
        .collection(replacedCollectionName)
        .where("userId", "==", userId)
        .get();

      if (snapshot.empty) {
        console.log(
          `[INFO] - No documents found in ${collectionName} for user ID: ${userId}`,
        );
        return [];
      }

      const documents = [];
      snapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(
        `[INFO] - Found ${documents.length} documents in ${collectionName} for user ID: ${userId}`,
      );

      return documents;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to find documents in ${collectionName} for user ID ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async findExpiredSubscriptions(collectionName) {
    try {
      const replacedCollectionName = this.replaceCollectionName(collectionName);
      const now = new Date();

      const snapshot = await this.db
        .collection(replacedCollectionName)
        .where("plan.expiresAt", "<", now)
        .get();

      if (snapshot.empty) {
        console.log(
          `[INFO] - No expired subscriptions found in ${collectionName}`,
        );
        return [];
      }

      const documents = [];
      snapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(
        `[INFO] - Found ${documents.length} expired subscriptions in ${collectionName}`,
      );

      return documents;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to find expired subscriptions in ${collectionName}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = {
  FirestoreAdapter,
};
