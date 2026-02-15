const { randomUUID } = require("crypto");
const { Pdf } = require("../../domain/entities/pdf.entity");
const SHA256 = require("crypto-js/sha256");

class CreatePdfUseCase {
  constructor(uploadImagesUseCase, firestoreAdapter) {
    this.uploadImagesUseCase = uploadImagesUseCase;
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(data, userId) {
    console.log("[START] - Create PDF");
    const pdfId = randomUUID();
    const enterpriseId = SHA256(data.url.trim()).toString();

    console.log("[INFO] - Uploading images");
    const imageUrls = await this.uploadImagesUseCase.execute(
      data.property.gallery,
      userId,
      data.url.trim(),
    );

    console.log("[INFO] - Creating PDF entity");
    const pdfEntity = new Pdf({
      brand: data.brand,
      property: {
        ...data.property,
        gallery: imageUrls,
        mainImage: imageUrls[0] || "N/D",
        sideImages: imageUrls.slice(0, 2),
      },
      userId: userId,
      pdfId: pdfId,
      type: data.type,
      enterpriseId,
    });

    console.log("[INFO] - Saving PDF to Firestore");
    await this.firestoreAdapter.saveWithId(
      "pdfs",
      pdfId,
      pdfEntity.toFirestore(),
    );

    console.log("[INFO] - PDF saved successfully");
    return pdfEntity;
  }
}

module.exports = {
  CreatePdfUseCase,
};
