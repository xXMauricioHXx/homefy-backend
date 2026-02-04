const { randomUUID } = require("crypto");
const { Pdf } = require("../../domain/entities/pdf.entity");
const {
  NoCreditsAvailableException,
} = require("../../domain/exceptions/no-credits-available.exception");

class CreatePdfUseCase {
  constructor(uploadImagesUseCase, firestoreAdapter, getUserByIdUseCase) {
    this.uploadImagesUseCase = uploadImagesUseCase;
    this.firestoreAdapter = firestoreAdapter;
    this.getUserByIdUseCase = getUserByIdUseCase;
  }

  async execute(data, userId) {
    const pdfId = randomUUID();

    // Verify if user exists
    console.log("[INFO] - Verifying user existence");
    const user = await this.getUserByIdUseCase.execute(userId);

    if (user.plan.credits <= 0) {
      throw new NoCreditsAvailableException("No credits available");
    }

    if (data.property.gallery.length > process.env.MAX_IMAGES) {
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

    user.useCredit();
    await this.firestoreAdapter.update("users", userId, user.toFirestore());

    console.log("[INFO] - PDF saved successfully");
    return pdfEntity;
  }
}

module.exports = {
  CreatePdfUseCase,
};
