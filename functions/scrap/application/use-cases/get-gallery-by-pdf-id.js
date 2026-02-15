const { Pdf } = require("../../domain/entities/pdf.entity");

class GetGalleryByPdfIdUseCase {
  constructor(pdfRepository) {
    this.pdfRepository = pdfRepository;
  }

  async execute(pdfId) {
    try {
      console.log(`[START] - Fetching PDFs for user ID: ${pdfId}`);

      const pdf = await this.pdfRepository.findGalleryByPdfId(pdfId);

      console.log(`[END] - Retrieved ${pdf.id} PDFs for user ID: ${pdfId}`);

      return new Pdf(pdf).toDomain();
    } catch (error) {
      console.error(
        `[ERROR] - Failed to fetch PDFs for user ID ${pdfId}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = {
  GetGalleryByPdfIdUseCase: GetGalleryByPdfIdUseCase,
};
