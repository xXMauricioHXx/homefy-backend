const { MapperFactory } = require("../factories/mapper-factory");

class GetPageContentUseCase {
  constructor(http, mapperFactory = null) {
    this.http = http;
    this.mapperFactory = mapperFactory || new MapperFactory();
  }

  async execute(url) {
    try {
      console.log("[START] - Scraping url service: ", url);

      // Seleciona o mapper apropriado baseado na URL
      const mapper = this.mapperFactory.getMapper(url);

      const html = await mapper.getContent(url);

      console.log("[INFO] - Scraping page content");
      const data = await mapper.map(html);

      return {
        data,
      };
    } catch (error) {
      console.error(`Failed to scrap url ${url}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  GetPageContentUseCase,
};
