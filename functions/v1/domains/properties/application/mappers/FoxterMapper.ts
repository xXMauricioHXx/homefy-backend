import * as cheerio from "cheerio";
import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class FoxterMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      const $ = cheerio.load(html);

      const scriptMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
      );

      if (!scriptMatch) {
        throw new Error(
          "Não foi possível encontrar os dados do Foxter no HTML",
        );
      }

      const jsonData = JSON.parse(scriptMatch[1]);
      const product = jsonData.props?.pageProps?.product;

      if (!product) {
        throw new Error("Estrutura de dados inválida no HTML do Foxter");
      }

      const baseUrl =
        product.images?.baseUrl ||
        process.env.FOXTER_IMAGES_BASE_URL ||
        "https://images.foxter.com.br/rest/image/outer/";
      const images: Array<{ etag: string }> = product.images?.data || [];

      const gallery = images.map((img) =>
        FoxterMapper.buildImageUrl(baseUrl, img.etag),
      );

      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      const bedrooms = FoxterMapper.extractBedrooms($);
      const bathrooms = FoxterMapper.extractBathrooms($);
      const parking = FoxterMapper.extractParking($);
      const pricePerSqm = FoxterMapper.extractPricePerSqm($);

      const city = FoxterMapper.getCity(product);

      return {
        source: {
          providerKey: "foxter",
          url,
        },
        brand: {
          name: product.developmentName || "Corretora",
          location: city || "N/D",
          headline: product.h1 || product.title || "N/D",
        },
        property: {
          title: product.h1 || product.title || "N/D",
          description: product.description || "N/D",
          features: product.features?.slice(0, 10) || [],
          infrastructures: product.developmentFeatures?.slice(0, 10) || [],
          areaSqm: product.areaPrivate || product.areaTotal || "N/D",
          bedrooms,
          bathrooms,
          parking,
          pricing: {
            priceText: FoxterMapper.formatPrice(product.saleValue),
            pricePerSqmText: pricePerSqm,
            condominiumText: product.condominiumAmountValue || "N/D",
            iptuText: product.iptu || "N/D",
          },
        },
        images: gallery,
      };
    } catch (error) {
      console.error("Erro ao fazer scraping do Foxter:", error);
      return FoxterMapper.emptyResult();
    }
  }

  async getContent(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.text();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildImageUrl(
    baseUrl: string,
    etag: string,
    size = "1024/1",
  ): string {
    if (!etag) return "N/D";
    return `${baseUrl}${size}/foxter/wm/${etag}`;
  }

  private static formatPrice(value: string | undefined): string {
    if (!value) return "N/D";
    const numericValue = value.replace(/\./g, "").replace(/,/g, ".");
    const number = parseFloat(numericValue);
    if (isNaN(number)) return value;
    return `R$ ${number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getCity(product: any): string {
    const name: string = product.h1 || product.title || "N/D";
    const parts = name.split("-");
    return parts.length > 1 ? parts[1].trim() : "N/D";
  }

  private static extractBedrooms($: cheerio.CheerioAPI): string {
    const characteristics = $("#product-characteristics");
    let bedrooms = "N/D";
    characteristics.find(".flex").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*dorm/i);
      if (match) {
        bedrooms = match[1];
        return false;
      }
    });
    return bedrooms;
  }

  private static extractBathrooms($: cheerio.CheerioAPI): string {
    const characteristics = $("#product-characteristics");
    let bathrooms = "N/D";
    characteristics.find(".flex").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*banheiro/i);
      if (match) {
        bathrooms = match[1];
        return false;
      }
    });
    return bathrooms;
  }

  private static extractParking($: cheerio.CheerioAPI): string {
    const characteristics = $("#product-characteristics");
    let parking = "N/D";
    characteristics.find(".flex").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*vaga/i);
      if (match) {
        parking = match[1];
        return false;
      }
    });
    return parking;
  }

  private static extractPricePerSqm($: cheerio.CheerioAPI): string {
    const characteristics = $("#product-characteristics");
    let pricePerSqm = "N/D";
    characteristics.find(".flex").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/R\$\s*([\d.,]+)\s*\/m²/i);
      if (match) {
        pricePerSqm = `R$ ${match[1]}/m²`;
        return false;
      }
    });
    return pricePerSqm;
  }

  private static emptyResult(): ScrapedData {
    return {
      source: {
        providerKey: "foxter",
        url: "",
      },
      brand: { name: "N/D", location: "N/D", headline: "N/D" },
      property: {
        title: "N/D",
        description: "N/D",
        features: [],
        infrastructures: [],
        areaSqm: "N/D",
        bedrooms: "N/D",
        bathrooms: "N/D",
        parking: "N/D",
        pricing: {
          priceText: "N/D",
          pricePerSqmText: "N/D",
          condominiumText: "N/D",
          iptuText: "N/D",
        },
      },
      images: [],
    };
  }
}
