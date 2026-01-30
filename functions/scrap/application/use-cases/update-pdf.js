class UpdatePdfUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(pdfId, configData) {
    console.log("[START] - Updating PDF config");

    // Verify if PDF exists
    const existingPdf = await this.firestoreAdapter.findById("pdfs", pdfId);

    if (!existingPdf) {
      throw new Error("PDF not found");
    }

    console.log("[INFO] - Updating PDF config in Firestore");
    await this.firestoreAdapter.update("pdfs", pdfId, { config: configData });

    console.log("[INFO] - PDF config updated successfully with ID:", pdfId);
    return {
      id: pdfId,
      ...existingPdf,
      config: configData,
      updatedAt: new Date(),
    };
  }
}

module.exports = {
  UpdatePdfUseCase,
};
