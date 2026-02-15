const { Pdf } = require("../../domain/entities/pdf.entity");

class GetPdfsByUserIdUseCase {
  constructor(pdfRepository) {
    this.pdfRepository = pdfRepository;
  }

  async execute(userId) {
    try {
      console.log(`[START] - Fetching PDFs for user ID: ${userId}`);

      const pdfs = await this.pdfRepository.findByUserId(userId);

      console.log(
        `[END] - Retrieved ${pdfs.length} PDFs for user ID: ${userId}`,
      );

      return pdfs.map((pdf) => {
        return new Pdf(pdf).toDomain();
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
