import * as cheerio from "cheerio";
import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class AuxiliadoraPredialMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      const $ = cheerio.load(html);

      const title = $("title").text() || $("h1").first().text();
      const price = this.extractPrice($);
      const area = this.extractArea($);
      const bedrooms = this.extractBedrooms($);
      const bathrooms = this.extractBathrooms($);
      const parking = this.extractParking($);
      const condominium = this.extractCondominium($);
      const iptu = this.extractIPTU($);
      const description = this.extractDescription($);
      const location = this.extractLocation(title);
      const features = this.extractFeatures($);
      const images = this.extractGallery($, html);

      return {
        source: {
          providerKey: "auxiliadora_predial",
          url,
        },
        brand: {
          name: "Auxiliadora Predial",
          location: location || "N/D",
          headline: title || "N/D",
        },
        property: {
          title: title || "N/D",
          description: description || "N/D",
          features: features.slice(0, 10),
          infrastructures: [],
          areaSqm: area || "N/D",
          bedrooms: bedrooms || "N/D",
          bathrooms: bathrooms || "N/D",
          parking: parking || "N/D",
          pricing: {
            priceText: price || "N/D",
            pricePerSqmText: this.calculatePricePerSqm(price, area),
            condominiumText: condominium || "N/D",
            iptuText: iptu || "N/D",
          },
        },
        images,
      };
    } catch (error) {
      console.error("Erro ao fazer scraping da Auxiliadora Predial:", error);
      return AuxiliadoraPredialMapper.emptyResult();
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

  private extractReference($: cheerio.CheerioAPI): string {
    let reference = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/ref[:\s]*(\d+)/i);
      if (match) {
        reference = match[1];
        return false;
      }
    });
    return reference;
  }

  private extractPrice($: cheerio.CheerioAPI): string {
    let price = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^R\$\s*([\d.,]+)$/);
      if (match && match[1].length > 3) {
        price = `R$ ${match[1]}`;
        return false;
      }
    });
    return price;
  }

  private extractArea($: cheerio.CheerioAPI): string {
    let area = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*m²$/i);
      if (match) {
        area = match[1];
        return false;
      }
    });
    return area;
  }

  private extractBedrooms($: cheerio.CheerioAPI): string {
    let bedrooms = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Dormitórios?$/i);
      if (match) {
        bedrooms = match[1];
        return false;
      }
    });
    return bedrooms;
  }

  private extractBathrooms($: cheerio.CheerioAPI): string {
    let bathrooms = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Banheiros?$/i);
      if (match) {
        bathrooms = match[1];
        return false;
      }
    });
    return bathrooms;
  }

  private extractParking($: cheerio.CheerioAPI): string {
    let parking = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Vagas?$/i);
      if (match) {
        parking = match[1];
        return false;
      }
    });
    return parking;
  }

  private extractCondominium($: cheerio.CheerioAPI): string {
    let condominium = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/Condomínio\s*\*?\s*R\$\s*([\d.,]+\/mês)/i);
      if (match) {
        condominium = `R$ ${match[1]}`;
        return false;
      }
    });
    return condominium;
  }

  private extractIPTU($: cheerio.CheerioAPI): string {
    let iptu = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/IPTU\s*\*?\s*R\$\s*([\d.,]+\/ano)/i);
      if (match) {
        iptu = `R$ ${match[1]}`;
        return false;
      }
    });
    return iptu;
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const descriptionElement = $("#descricao .half-text-hidden");
    if (descriptionElement.length > 0) {
      const description = descriptionElement.text().trim();
      if (description) return description;
    }

    let description = "N/D";
    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();
      if (
        text.length > 100 &&
        (text.includes("Exclusividade") || text.includes("Imóvel"))
      ) {
        description = text;
        return false;
      }
    });
    return description;
  }

  private extractLocation(title: string): string {
    const match = title.match(/em\s+([^.]+)/i);
    if (match) return match[1].trim();
    return "N/D";
  }

  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = [];
    let inFeaturesSection = false;

    $("*").each((_i, elem) => {
      const text = $(elem).text().trim();

      if (text === "Sobre o lugar") {
        inFeaturesSection = true;
        return;
      }

      if (text === "Entre em contato") {
        inFeaturesSection = false;
        return false;
      }

      if (
        inFeaturesSection &&
        text.length > 2 &&
        text.length < 30 &&
        !text.includes("Sobre o lugar") &&
        !text.match(/[A-Z][a-z]+[A-Z]/)
      ) {
        if (!features.includes(text)) {
          features.push(text);
        }
      }
    });

    return features;
  }

  private extractGallery($: cheerio.CheerioAPI, html: string): string[] {
    const gallery: string[] = [];

    const imageUrls = html.match(
      /https?:\/\/[^"'\s]*auxiliadorapredial[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
    );

    if (imageUrls) {
      imageUrls.forEach((url) => {
        if (url.includes("thumb/1920") && !url.includes("_p.jpg")) {
          if (!gallery.includes(url)) {
            gallery.push(url);
          }
        }
      });
    }

    if (gallery.length === 0) {
      $("img").each((_i, elem) => {
        const src = $(elem).attr("src");
        if (
          src &&
          src.includes("auxiliadorapredial.com.br") &&
          !src.includes("_p.jpg")
        ) {
          if (!gallery.includes(src)) {
            gallery.push(src);
          }
        }
      });
    }

    return gallery;
  }

  private calculatePricePerSqm(price: string, area: string): string {
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
        providerKey: "auxiliadora_predial",
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
