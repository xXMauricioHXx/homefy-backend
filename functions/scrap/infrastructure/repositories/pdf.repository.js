const { getFirestore } = require("firebase-admin/firestore");

class PdfRepository {
  constructor() {
    this.db = getFirestore();
    this.environment = process.env.NODE_ENV == "development" ? "-dev" : "";
  }

  replaceCollectionName(collectionName) {
    return collectionName + this.environment;
  }

  async findById(pdfId) {
    try {
      const replacedCollectionName = this.replaceCollectionName("pdfs");

      const doc = await this.db
        .collection(replacedCollectionName)
        .doc(pdfId)
        .get();

      if (!doc.exists) {
        console.log(`[INFO] - PDF not found with ID: ${pdfId}`);
        return null;
      }

      const data = doc.data();

      // Validate that the document type is "pdf"
      if (data.type !== "pdf") {
        console.log(
          `[INFO] - Document with ID ${pdfId} is not of type "pdf" (found type: ${data.type})`,
        );
        return null;
      }

      console.log(`[INFO] - PDF found with ID: ${pdfId}`);
      return data;
    } catch (error) {
      console.error(`[ERROR] - Failed to find PDF with ID ${pdfId}:`, error);
      throw error;
    }
  }

  async findByUserId(userId) {
    try {
      const replacedCollectionName = this.replaceCollectionName("pdfs");

      const snapshot = await this.db
        .collection(replacedCollectionName)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) {
        console.log(
          `[INFO] - No documents found in pdfs for user ID: ${userId}`,
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
        `[INFO] - Found ${documents.length} documents in pdfs for user ID: ${userId}`,
      );

      return documents;
    } catch (error) {
      console.error(
        `[ERROR] - Failed to find documents in pdfs for user ID ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async findGalleryByPdfId(pdfId) {
    try {
      const replacedCollectionName = this.replaceCollectionName("pdfs");

      const snapshot = await this.db
        .collection(replacedCollectionName)
        .where("type", "==", "gallery")
        .where("pdfId", "==", pdfId)
        .get();

      if (snapshot.empty) {
        console.log(`[INFO] - No documents found in pdfs for pdf ID: ${pdfId}`);
        return null;
      }

      console.log(
        `[INFO] - Found ${snapshot.docs.length} documents in pdfs for pdf ID: ${pdfId}`,
      );
      return snapshot.docs[0].data();
    } catch (error) {
      console.error(
        `[ERROR] - Failed to find documents in pdfs for pdf ID ${pdfId}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = {
  PdfRepository,
};
