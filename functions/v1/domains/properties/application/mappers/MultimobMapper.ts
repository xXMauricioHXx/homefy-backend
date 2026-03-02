import * as cheerio from "cheerio";
import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class MultimobMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      const $ = cheerio.load(html);

      const title = $("h1").first().text().trim() || "N/D";

      const codeText = $("body").text();
      const codeMatch = codeText.match(/CÓD[.:\s]*(\d+)/i);
      const reference = codeMatch ? codeMatch[1] : "N/D";

      const price = this.extractPrice($);
      const location = this.extractLocation($);
      const description = this.extractDescription($);
      const stats = this.extractStats($);
      const iptu = this.extractIPTU($);
      const condominium = this.extractCondominium($);
      const { features, infrastructures } = this.extractFeatures($);

      const name = $(
        "body > section.fleft100.ficha > div > div.d-flex-wrap.justify-content-center > div.col-lg-6.px-0 > div > div:nth-child(2) > h1",
      )
        .text()
        .split(",")[0];

      const gallery = this.extractGallery($);
      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      const pricePerSqm = this.calculatePricePerSqm(price, stats.area);

      return {
        source: {
          providerKey: "multimob",
          url,
        },
        brand: {
          name: name || "N/D",
          location: location || "N/D",
          headline: title,
        },
        property: {
          title,
          description,
          features: features.slice(0, 10),
          infrastructures: infrastructures.slice(0, 10),
          areaSqm: stats.area || "N/D",
          bedrooms: stats.bedrooms || "N/D",
          bathrooms: stats.bathrooms || "N/D",
          parking: stats.parking || "N/D",
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
      console.error("Erro ao fazer scraping do Multimob:", error);
      return MultimobMapper.emptyResult();
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

  private extractPrice($: cheerio.CheerioAPI): string {
    let priceText = "N/D";

    const priceSpan = $("li.valor span, span.valor span").first();
    if (priceSpan.length > 0) {
      priceText = priceSpan.text().trim();
    }

    if (!priceText || priceText === "N/D") {
      const priceMatch = $("body")
        .text()
        .match(/R\$\s*([\d.]+)/);
      if (priceMatch) {
        priceText = `R$ ${priceMatch[1]}`;
      }
    }

    if (priceText.includes("R$")) {
      const uniquePrices = [...new Set(priceText.match(/R\$\s*[\d.]+/g))];
      if (uniquePrices.length > 0) {
        priceText = uniquePrices[0];
      }
    }

    return priceText;
  }

  private extractLocation($: cheerio.CheerioAPI): string {
    const address =
      $(".endereco-imovel").text().trim() ||
      $("h1").next().text().trim().split("\n")[0].trim();

    if (address) {
      const parts = address.split(",");
      if (parts.length > 1) return parts[parts.length - 1].trim();
      return address;
    }

    return "N/D";
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    let description = "N/D";

    const commonDivs = $(".col-12 div, .col-12 p");
    commonDivs.each((_i, elem) => {
      const text = $(elem).text().trim();
      if (
        text.length > 100 &&
        (text.includes("área privativa") ||
          text.includes("dormitórios") ||
          text.includes("localizada"))
      ) {
        description = text;
        return false;
      }
    });

    if (description === "N/D") {
      description = $(".descricao-imovel").text().trim() || "N/D";
    }

    return description;
  }

  private extractStats($: cheerio.CheerioAPI): {
    area: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    parking: string | null;
  } {
    const stats: {
      area: string | null;
      bedrooms: string | null;
      bathrooms: string | null;
      parking: string | null;
    } = { area: null, bedrooms: null, bathrooms: null, parking: null };

    $("ul.is li").each((_i, elem) => {
      const label = $(elem).find("small").text().trim().toUpperCase();
      const value = $(elem).find("span").text().trim();

      if (label.includes("ÁREA") || label.includes("M²")) {
        stats.area = value;
      } else if (label.includes("DORM")) {
        stats.bedrooms = value;
      } else if (label.includes("SUÍTE")) {
        if (!stats.bathrooms) stats.bathrooms = value;
      } else if (label.includes("VAGA")) {
        stats.parking = value;
      }
    });

    if (!stats.area || !stats.bedrooms || !stats.parking) {
      $("small").each((_i, elem) => {
        const label = $(elem).text().trim().toUpperCase();
        const parentLi = $(elem).closest("li");
        const value =
          parentLi.find("span").text().trim() ||
          $(elem).nextAll("span").first().text().trim() ||
          $(elem).prevAll("span").first().text().trim();

        if (label.includes("ÁREA") || label.includes("M²")) {
          if (!stats.area) stats.area = value;
        } else if (label.includes("DORM")) {
          if (!stats.bedrooms) stats.bedrooms = value;
        } else if (label.includes("VAGA")) {
          if (!stats.parking) stats.parking = value;
        }
      });
    }

    let bathroomCount = 0;
    const bathroomTypes = [
      "banheiro social",
      "lavabo",
      "wc de empregada",
      "banheiro auxiliar",
    ];

    $("li").each((_i, elem) => {
      const text = $(elem).text().trim().toLowerCase();
      if (bathroomTypes.some((t) => text.includes(t))) {
        bathroomCount++;
      }
    });

    const suiteMatch = $("ul.is li")
      .find("small:contains('SUÍTE')")
      .parent()
      .find("span")
      .text()
      .trim();
    const suites = parseInt(suiteMatch) || 0;

    const finalBathrooms = Math.max(suites + bathroomCount, suites);

    if (finalBathrooms > 0) {
      stats.bathrooms = finalBathrooms.toString();
    }

    return stats;
  }

  private extractIPTU($: cheerio.CheerioAPI): string {
    let iptu = "N/D";
    $(".col-12.cts li, .item-detalhe-valor, li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const iptuMatch = text.match(/IPTU[:\s]*R\$\s*([\d.]+)/i);
      if (iptuMatch) {
        iptu = `R$ ${iptuMatch[1]}`;
        return false;
      }
    });
    return iptu;
  }

  private extractCondominium($: cheerio.CheerioAPI): string {
    let condominium = "N/D";
    $(".col-12.cts li, .item-detalhe-valor, li").each((_i, elem) => {
      const text = $(elem).text().trim();
      const condoMatch = text.match(/CONDOMÍNIO[:\s]*R\$\s*([\d.]+)/i);
      if (condoMatch) {
        condominium = `R$ ${condoMatch[1]}`;
        return false;
      }
    });
    return condominium;
  }

  private extractFeatures($: cheerio.CheerioAPI): {
    features: string[];
    infrastructures: string[];
  } {
    const features: string[] = [];

    $(".col-12.cts").each((_i, elem) => {
      const title = $(elem).find("h2, h3").text().trim().toLowerCase();
      if (
        title.includes("características") ||
        title.includes("infraestrutura")
      ) {
        $(elem)
          .find("li")
          .each((_j, li) => {
            const item = $(li).text().trim();
            if (item) features.push(item);
          });
      }
    });

    if (features.length === 0) {
      $(".caracteristicas-imovel li, [class*='caracteristica'] li").each(
        (_i, elem) => {
          const item = $(elem).text().trim();
          if (item) features.push(item);
        },
      );
    }

    return { features, infrastructures: [] };
  }

  private extractGallery($: cheerio.CheerioAPI): string[] {
    const gallery: string[] = [];

    $('a[data-fancybox="gallery"]').each((_i, elem) => {
      const href = $(elem).attr("href");
      if (href && href.includes("cdn.vistahost.com.br")) {
        const fullSizeUrl = href.replace(/_p\.jpg$/, ".jpg");
        if (!gallery.includes(fullSizeUrl)) gallery.push(fullSizeUrl);
      }
    });

    if (gallery.length === 0) {
      $("img").each((_i, elem) => {
        const src = $(elem).attr("src");
        if (src && src.includes("cdn.vistahost.com.br")) {
          const fullSizeUrl = src.replace(/_p\.jpg$/, ".jpg");
          if (!gallery.includes(fullSizeUrl)) gallery.push(fullSizeUrl);
        }
      });
    }
    return gallery;
  }

  private calculatePricePerSqm(priceStr: string, area: string | null): string {
    if (!priceStr || !area || priceStr === "N/D" || area === "N/D")
      return "N/D";
    try {
      const priceMatch = priceStr.match(/[\d.]+/g);
      if (!priceMatch) return "N/D";
      const numericPrice = parseFloat(priceMatch.join("").replace(/\./g, ""));
      const numericArea = parseFloat(area.replace(/[^\d]/g, ""));
      if (isNaN(numericPrice) || isNaN(numericArea) || numericArea === 0)
        return "N/D";
      const pricePerSqm = numericPrice / numericArea;
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
        providerKey: "multimob",
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
