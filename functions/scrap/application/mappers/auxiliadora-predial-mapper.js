const cheerio = require("cheerio");
const { HttpAdapter } = require("../../adapters/http.adapter");

class AuxiliadoraPredialMapper {
  constructor() {
    this.http = new HttpAdapter();
  }

  async map(html) {
    try {
      const $ = cheerio.load(html);

      // Extract basic information
      const title = $("title").text() || $("h1").first().text();
      const reference = this.extractReference($);
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
      const gallery = this.extractGallery($, html);

      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      const scrapedData = {
        brand: {
          name: "Auxiliadora Predial",
          location: location || "N/D",
          description: title || "N/D",
        },
        property: {
          resume: title || "N/D",
          description: description || "N/D",
          reference: reference || "N/D",
          mainImage,
          sideImages,
          gallery,
          features: features.slice(0, 10),
          infrastructures: [],
          area: area || "N/D",
          bedrooms: bedrooms || "N/D",
          bathrooms: bathrooms || "N/D",
          condominium: condominium || "N/D",
          parking: parking || "N/D",
          iptu: iptu || "N/D",
          price: price || "N/D",
          pricePerSqm: this.calculatePricePerSqm(price, area),
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping da Auxiliadora Predial:", error);

      return {
        brand: {
          name: "N/D",
          location: "N/D",
          description: "N/D",
        },
        property: {
          resume: "N/D",
          description: "N/D",
          reference: "N/D",
          mainImage: "N/D",
          sideImages: [],
          gallery: [],
          features: [],
          infrastructures: [],
          area: "N/D",
          bedrooms: "N/D",
          bathrooms: "N/D",
          condominium: "N/D",
          parking: "N/D",
          iptu: "N/D",
          price: "N/D",
          pricePerSqm: "N/D",
        },
      };
    }
  }

  extractReference($) {
    let reference = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/ref[:\s]*(\d+)/i);
      if (match) {
        reference = match[1];
        return false;
      }
    });
    return reference;
  }

  extractPrice($) {
    let price = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      // Match "R$ 470.000" or similar
      const match = text.match(/^R\$\s*([\d.,]+)$/);
      if (match && match[1].length > 3) {
        // Ensure it's not a small number
        price = `R$ ${match[1]}`;
        return false;
      }
    });
    return price;
  }

  extractArea($) {
    let area = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*m²$/i);
      if (match) {
        area = match[1];
        return false;
      }
    });
    return area;
  }

  extractBedrooms($) {
    let bedrooms = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Dormitórios?$/i);
      if (match) {
        bedrooms = match[1];
        return false;
      }
    });
    return bedrooms;
  }

  extractBathrooms($) {
    let bathrooms = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Banheiros?$/i);
      if (match) {
        bathrooms = match[1];
        return false;
      }
    });
    return bathrooms;
  }

  extractParking($) {
    let parking = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)\s*Vagas?$/i);
      if (match) {
        parking = match[1];
        return false;
      }
    });
    return parking;
  }

  extractCondominium($) {
    let condominium = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/Condomínio\s*\*?\s*R\$\s*([\d.,]+\/mês)/i);
      if (match) {
        condominium = `R$ ${match[1]}`;
        return false;
      }
    });
    return condominium;
  }

  extractIPTU($) {
    let iptu = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/IPTU\s*\*?\s*R\$\s*([\d.,]+\/ano)/i);
      if (match) {
        iptu = `R$ ${match[1]}`;
        return false;
      }
    });
    return iptu;
  }

  extractDescription($) {
    // Look for description in the element with id="descricao" and class "half-text-hidden"
    const descriptionElement = $("#descricao .half-text-hidden");

    if (descriptionElement.length > 0) {
      const description = descriptionElement.text().trim();
      if (description) {
        return description;
      }
    }

    // Fallback: look for description section
    let description = "N/D";
    $("*").each((i, elem) => {
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

  extractAddress($) {
    let address = "N/D";
    $("*").each((i, elem) => {
      const text = $(elem).text().trim();
      // Look for address pattern with street name and neighborhood
      if (text.match(/^(Avenida|Rua|Travessa)/i) && text.includes(",")) {
        address = text;
        return false;
      }
    });
    return address;
  }

  extractLocation(title) {
    // Extract location from title like "Apartamento com 2 quartos e 81m² à venda em Petrópolis, Porto Alegre."
    const match = title.match(/em\s+([^.]+)/i);
    if (match) {
      return match[1].trim();
    }
    return "N/D";
  }

  extractFeatures($) {
    const features = [];
    let inFeaturesSection = false;

    $("*").each((i, elem) => {
      const text = $(elem).text().trim();

      // Detect "Sobre o lugar" section
      if (text === "Sobre o lugar") {
        inFeaturesSection = true;
        return;
      }

      // Stop at "Entre em contato" section
      if (text === "Entre em contato") {
        inFeaturesSection = false;
        return false;
      }

      // Collect features in the section
      // Filter out concatenated text by checking if it's too long or contains multiple features
      if (
        inFeaturesSection &&
        text.length > 2 &&
        text.length < 30 && // Reduced from 50 to avoid concatenated strings
        !text.includes("Sobre o lugar") &&
        !text.match(/[A-Z][a-z]+[A-Z]/) // Avoid camelCase-like concatenations
      ) {
        if (!features.includes(text)) {
          features.push(text);
        }
      }
    });

    return features;
  }

  extractGallery($, html) {
    const gallery = [];

    // Extract all image URLs from the HTML (including those in scripts)
    // Focus on high-resolution images (1920px) and exclude preview images (_p.jpg)
    const imageUrls = html.match(
      /https?:\/\/[^"'\s]*auxiliadorapredial[^"'\s]*\.(jpg|jpeg|png|webp)/gi,
    );

    if (imageUrls) {
      imageUrls.forEach((url) => {
        // Only include high-resolution images (thumb/1920) and exclude preview images (_p.jpg)
        if (url.includes("thumb/1920") && !url.includes("_p.jpg")) {
          if (!gallery.includes(url)) {
            gallery.push(url);
          }
        }
      });
    }

    // If no high-res images found, fall back to any auxiliadora images
    if (gallery.length === 0) {
      $("img").each((i, elem) => {
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

  calculatePricePerSqm(price, area) {
    if (price === "N/D" || area === "N/D") {
      return "N/D";
    }

    try {
      // Remove "R$" and convert to number
      const priceValue = parseFloat(
        price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
      );
      const areaValue = parseFloat(area);

      if (isNaN(priceValue) || isNaN(areaValue) || areaValue === 0) {
        return "N/D";
      }

      const pricePerSqm = priceValue / areaValue;
      return `R$ ${pricePerSqm.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}/m²`;
    } catch (error) {
      return "N/D";
    }
  }

  async getContent(url) {
    return await this.http.get(url, "text");
  }
}

module.exports = {
  AuxiliadoraPredialMapper,
};
