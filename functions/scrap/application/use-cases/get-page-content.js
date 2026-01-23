const { Pdf } = require("../../domain/entities/pdf.entity");

class GetPageContentUseCase {
  constructor(http, foxterMapper, firestoreAdapter) {
    this.http = http;
    this.foxterMapper = foxterMapper;
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(url, userId) {
    try {
      console.log("[START] - Scraping url service: ", url);
      const html = await this.http.get(url, "text");

      console.log("[INFO] - Scraping page content");
      const data = this.foxterMapper.map(html);

      console.log("[INFO] - Creating PDF entity");
      const pdfEntity = new Pdf({
        brand: data.brand,
        property: data.property,
        userId: userId,
      });

      console.log("[INFO] - Saving PDF to Firestore");
      const pdfId = await this.firestoreAdapter.save(
        "pdfs",
        pdfEntity.toFirestore(),
      );

      console.log("[END] - Page content scraped and saved with ID:", pdfId);

      return {
        pdfId,
        data,
      };
    } catch (error) {
      console.error(`Failed to scrap url ${url}: ${error}`);
      throw error;
    }
  }
}

module.exports = {
  GetPageContentUseCase,
};
