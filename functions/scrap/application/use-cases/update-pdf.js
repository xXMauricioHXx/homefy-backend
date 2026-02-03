class UpdatePdfUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(pdfId, data) {
    console.log("[START] - Updating PDF config");

    // Verify if PDF exists
    const existingPdf = await this.firestoreAdapter.findById("pdfs", pdfId);

    if (!existingPdf) {
      throw new Error("PDF not found");
    }

    console.log(data);

    console.log("[INFO] - Updating PDF config in Firestore");
    await this.firestoreAdapter.update("pdfs", pdfId, {
      property: {
        ...existingPdf.property,
        ...(data.propertyData && { ...data.propertyData }),
      },
      config: {
        colors: {
          ...existingPdf?.config?.colors,
          ...(data?.colors && { ...data.colors }),
        },
      },
    });

    console.log("[INFO] - PDF config updated successfully with ID:", pdfId);
    return {
      id: pdfId,
      ...existingPdf,
      config: data.config,
      updatedAt: new Date(),
    };
  }
}

module.exports = {
  UpdatePdfUseCase,
};
