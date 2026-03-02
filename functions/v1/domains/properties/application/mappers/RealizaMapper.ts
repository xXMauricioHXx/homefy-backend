import * as cheerio from "cheerio";
import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class RealizaMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      const $ = cheerio.load(html);

      const brandName =
        $('meta[property="og:site_name"]').attr("content") || "Realiza Imóveis";

      const location = RealizaMapper.extractLocation($);
      const description =
        $('meta[name="description"]').attr("content") || "N/D";
      const resume = $("h1").first().text().trim() || "N/D";
      const reference = RealizaMapper.extractReference($);
      const gallery = RealizaMapper.extractGallery($);
      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);
      const features = RealizaMapper.extractFeatures($);
      const infrastructures = RealizaMapper.extractInfrastructures($);
      const area = RealizaMapper.extractArea($);
      const bedrooms = RealizaMapper.extractBedrooms($);
      const bathrooms = RealizaMapper.extractBathrooms($);
      const parking = RealizaMapper.extractParking($);
      const price = RealizaMapper.extractPrice($);
      const condominium = RealizaMapper.extractCondominium($);
      const iptu = RealizaMapper.extractIPTU($);
      const pricePerSqm = RealizaMapper.calculatePricePerSqm(price, area);

      return {
        source: {
          providerKey: "realiza",
          url,
        },
        brand: {
          name: brandName,
          location: location || "N/D",
          headline: resume,
        },
        property: {
          title: resume,
          description,
          features,
          infrastructures,
          areaSqm: area,
          bedrooms,
          bathrooms,
          parking,
          pricing: {
            priceText: price,
            pricePerSqmText: pricePerSqm,
            condominiumText: condominium,
            iptuText: iptu,
          },
        },
        images: gallery,
      };
    } catch (error) {
      console.error("Erro ao fazer scraping do Realiza:", error);
      return RealizaMapper.emptyResult();
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

  private static extractLocation($: cheerio.CheerioAPI): string {
    const breadcrumbs = $(".brands li");
    let location = "N/D";

    breadcrumbs.each((i, elem) => {
      const text = $(elem).text().trim();
      if (i === 2 || i === 3) {
        if (text && text !== "Venda" && text !== "Início") {
          location = text;
          return false;
        }
      }
    });

    return location;
  }

  private static extractReference($: cheerio.CheerioAPI): string {
    const breadcrumbs = $(".brands li");
    let reference = "N/D";

    breadcrumbs.each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/Código\s+(\d+)/i);
      if (match) {
        reference = match[1];
        return false;
      }
    });

    if (reference === "N/D") {
      const dataCode = $("[data-codigo]").first().attr("data-codigo");
      if (dataCode) reference = dataCode;
    }

    return reference;
  }

  private static extractGallery($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    $(".thumbs li figure a").each((_i, elem) => {
      const href = $(elem).attr("href");
      if (href && href.startsWith("http")) {
        images.push(href);
      }
    });

    return images;
  }

  private static extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = [];

    $(".infra ul li, .features ul li, .caracteristicas li").each((_i, elem) => {
      const text = $(elem).text().trim();
      if (text && features.length < 10) features.push(text);
    });

    return features;
  }

  private static extractInfrastructures($: cheerio.CheerioAPI): string[] {
    const infrastructures: string[] = [];

    $(".infrastructures ul li, .amenidades li, .lazer li").each((_i, elem) => {
      const text = $(elem).text().trim();
      if (text && infrastructures.length < 10) infrastructures.push(text);
    });

    return infrastructures;
  }

  private static extractArea($: cheerio.CheerioAPI): string {
    let area = "N/D";
    $(".va-itens li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)m²/i);
      if (match) {
        area = match[1];
        return false;
      }
    });
    return area;
  }

  private static extractBedrooms($: cheerio.CheerioAPI): string {
    let bedrooms = "N/D";
    $(".va-itens li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*quarto/i);
      if (match) {
        bedrooms = match[1];
        return false;
      }
    });
    return bedrooms;
  }

  private static extractBathrooms($: cheerio.CheerioAPI): string {
    let bathrooms = "N/D";
    $(".va-itens li").each((_i, elem) => {
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
    let parking = "N/D";
    $(".va-itens li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*vaga/i);
      if (match) {
        parking = match[1];
        return false;
      }
    });
    return parking;
  }

  private static extractPrice($: cheerio.CheerioAPI): string {
    let price = "N/D";
    $(".va-itens li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/R\$\s*([\d.,]+)/i);
      if (match) {
        price = `R$ ${match[1]}`;
        return false;
      }
    });
    return price;
  }

  private static extractCondominium($: cheerio.CheerioAPI): string {
    let condominium = "N/D";
    $("li, p, span, div").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/condom[ií]nio[:\s]*R\$\s*([\d.,]+)/i);
      if (match) {
        condominium = `R$ ${match[1]}`;
        return false;
      }
    });
    return condominium;
  }

  private static extractIPTU($: cheerio.CheerioAPI): string {
    let iptu = "N/D";
    $("li, p, span, div").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/IPTU[:\s]*R\$\s*([\d.,]+)/i);
      if (match) {
        iptu = `R$ ${match[1]}`;
        return false;
      }
    });
    return iptu;
  }

  private static calculatePricePerSqm(price: string, area: string): string {
    if (price === "N/D" || area === "N/D") return "N/D";
    try {
      const priceValue = parseFloat(
        price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
      );
      const areaValue = parseFloat(area);
      if (isNaN(priceValue) || isNaN(areaValue) || areaValue === 0)
        return "N/D";
      const pricePerSqm = priceValue / areaValue;
      return `R$ ${pricePerSqm.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}/m²`;
    } catch {
      return "N/D";
    }
  }

  private static emptyResult(): ScrapedData {
    return {
      source: {
        providerKey: "realiza",
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
