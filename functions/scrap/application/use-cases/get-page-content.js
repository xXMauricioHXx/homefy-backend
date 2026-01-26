class GetPageContentUseCase {
  constructor(http, foxterMapper) {
    this.http = http;
    this.foxterMapper = foxterMapper;
  }

  async execute(url) {
    try {
      console.log("[START] - Scraping url service: ", url);
      const html = await this.http.get(url, "text");

      console.log("[INFO] - Scraping page content");
      const data = this.foxterMapper.map(html);

      return {
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
