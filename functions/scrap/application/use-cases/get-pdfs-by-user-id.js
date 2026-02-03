class GetPdfsByUserIdUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(userId) {
    try {
      console.log(`[START] - Fetching PDFs for user ID: ${userId}`);

      const pdfs = await this.firestoreAdapter.findByUserId("pdfs", userId);

      console.log(
        `[END] - Retrieved ${pdfs.length} PDFs for user ID: ${userId}`,
      );

      return pdfs.map((pdf) => {
        return {
          id: pdf.id,
          ...pdf,
          createdAt: pdf.createdAt.toDate(),
          updatedAt: pdf.updatedAt.toDate(),
        };
      });
    } catch (error) {
      console.error(
        `[ERROR] - Failed to fetch PDFs for user ID ${userId}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = {
  GetPdfsByUserIdUseCase,
};
