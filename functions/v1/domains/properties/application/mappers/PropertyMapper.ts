import { ScrapedData } from "./ScrapedPropertySchema";

export interface PropertyMapper {
  map(html: string, url: string): Promise<ScrapedData>;
  getContent(url: string): Promise<string>;
}
