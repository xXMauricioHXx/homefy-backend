import { PropertyFactory } from "../factories/PropertyFactory";
import { ScrapedData } from "../mappers/ScrapedPropertySchema";

export class ScrapPropertyUseCase {
  private readonly propertyFactory: PropertyFactory;

  constructor() {
    this.propertyFactory = new PropertyFactory();
  }

  async execute(url: string): Promise<ScrapedData> {
    console.log("[START] - Scrap Property");

    console.log("[INFO] - Getting mapper for URL:", url);
    const mapper = this.propertyFactory.getMapper(url);

    console.log("[INFO] - Fetching HTML content");
    const html = await mapper.getContent(url);

    console.log("[INFO] - Mapping HTML to property data");
    const scrapedData = await mapper.map(html, url);

    console.log("[INFO] - Scrap Property completed successfully");
    return scrapedData;
  }
}
