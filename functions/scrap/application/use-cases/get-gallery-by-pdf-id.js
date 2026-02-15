const { Pdf } = require("../../domain/entities/pdf.entity");

class GetGalleryByPdfIdUseCase {
  constructor(pdfRepository) {
    this.pdfRepository = pdfRepository;
  }

  async execute(pdfId) {
    try {
      console.log(`[START] - Fetching gallery for PDF ID: ${pdfId}`);

      const pdf = await this.pdfRepository.findGalleryByPdfId(pdfId);

      if (!pdf) {
        console.log(`[INFO] - Gallery not found for PDF ID: ${pdfId}`);
        throw new Error("Gallery not found");
      }

      console.log(`[END] - Retrieved gallery for PDF ID: ${pdfId}`);

      return new Pdf(pdf).toDomain();
    } catch (error) {
      console.error(
        `[ERROR] - Failed to fetch gallery for PDF ID ${pdfId}:`,
        error,
      );
      throw error;
    }
  }
}

module.exports = {
  GetGalleryByPdfIdUseCase: GetGalleryByPdfIdUseCase,
};
