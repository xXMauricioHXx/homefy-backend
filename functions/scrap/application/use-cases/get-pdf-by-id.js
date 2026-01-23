class GetPdfByIdUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(pdfId) {
    try {
      console.log(`[START] - Fetching PDF with ID: ${pdfId}`);

      const pdfData = await this.firestoreAdapter.findById("pdfs", pdfId);

      if (!pdfData) {
        console.log(`[INFO] - PDF not found with ID: ${pdfId}`);
        throw new Error("PDF not found");
      }

      console.log(`[END] - PDF retrieved successfully with ID: ${pdfId}`);

      delete pdfData.userId;

      return pdfData;
    } catch (error) {
      console.error(`[ERROR] - Failed to fetch PDF with ID ${pdfId}:`, error);
      throw error;
    }
  }
}

module.exports = {
  GetPdfByIdUseCase,
};
