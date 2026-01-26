const { randomUUID } = require("crypto");
const { Pdf } = require("../../domain/entities/pdf.entity");

class CreatePdfUseCase {
  constructor(uploadImagesUseCase, firestoreAdapter) {
    this.uploadImagesUseCase = uploadImagesUseCase;
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(data, userId) {
    const pdfId = randomUUID();

    if (data.property.gallery.length > 5) {
      throw new Error("Gallery size is greater than 5");
    }

    const imageUrls = await this.uploadImagesUseCase.execute(
      data.property.gallery,
      pdfId,
    );

    console.log("[START] - Creating PDF entity");
    const pdfEntity = new Pdf({
      brand: data.brand,
      property: {
        ...data.property,
        gallery: imageUrls,
        mainImage: imageUrls[0] || "N/A",
        sideImages: imageUrls.slice(0, 2),
      },
      userId: userId,
      pdfId: pdfId,
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
