const cheerio = require("cheerio");
const { HttpAdapter } = require("../../adapters/http.adapter");

class MultimobMapper {
  constructor() {
    this.http = new HttpAdapter();
  }

  async map(html) {
    try {
      // Carrega o HTML no Cheerio para extração de dados
      const $ = cheerio.load(html);

      // Extract title
      const title = $("h1").first().text().trim() || "N/D";

      // Extract property code
      const codeText = $("body").text();
      const codeMatch = codeText.match(/CÓD[.:\s]*(\d+)/i);
      const reference = codeMatch ? codeMatch[1] : "N/D";

      // Extract price
      const price = this.extractPrice($);

      // Extract address/location
      const location = this.extractLocation($);

      // Extract description
      const description = this.extractDescription($);

      // Extract property stats (area, bedrooms, suites, parking)
      const stats = this.extractStats($);

      // Extract IPTU and Condominium
      const iptu = this.extractIPTU($);
      const condominium = this.extractCondominium($);

      // Extract features and infrastructure
      const { features, infrastructures } = this.extractFeatures($);

      const name = $(
        "body > section.fleft100.ficha > div > div.d-flex-wrap.justify-content-center > div.col-lg-6.px-0 > div > div:nth-child(2) > h1",
      )
        .text()
        .split(",")[0];

      // Extract images
      const gallery = this.extractGallery($);
      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      // Calculate price per sqm
      const pricePerSqm = this.calculatePricePerSqm(price, stats.area);

      const scrapedData = {
        brand: {
          name: name,
          location: location || "N/D",
          description: title,
        },
        property: {
          resume: title,
          description,
          reference,
          mainImage,
          sideImages,
          gallery,
          features: features.slice(0, 10),
          infrastructures: infrastructures.slice(0, 10),
          area: stats.area || "N/D",
          bedrooms: stats.bedrooms || "N/D",
          bathrooms: stats.bathrooms || "N/D",
          condominium,
          parking: stats.parking || "N/D",
          iptu,
          price,
          pricePerSqm,
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping do Multimob:", error);

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

  extractPrice($) {
    // Exact selector revealed by inspection: .valor span (or li.valor span)
    let priceText = "N/D";

    // Procura por .valor span
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

    // Clean up if duplicated (e.g., "R$ 1.650.000R$ 1.650.000")
    if (priceText.includes("R$")) {
      const uniquePrices = [...new Set(priceText.match(/R\$\s*[\d.]+/g))];
      if (uniquePrices.length > 0) {
        priceText = uniquePrices[0];
      }
    }

    return priceText;
  }

  extractLocation($) {
    // Address often follows h1 or has a specific container
    const address =
      $(".endereco-imovel").text().trim() ||
      $("h1").next().text().trim().split("\n")[0].trim();

    if (address) {
      const parts = address.split(",");
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return address;
    }

    return "N/D";
  }

  extractDescription($) {
    // From inspection: The description is a div following or in a col-12 container near the stats
    let description = "N/D";

    const commonDivs = $(".col-12 div, .col-12 p");
    commonDivs.each((i, elem) => {
      const text = $(elem).text().trim();
      if (
        text.length > 100 &&
        (text.includes("área privativa") ||
          text.includes("dormitórios") ||
          text.includes("localizada"))
      ) {
        description = text;
        return false; // break
      }
    });

    if (description === "N/D") {
      description = $(".descricao-imovel").text().trim();
    }

    return description;
  }

  extractStats($) {
    const stats = {
      area: null,
      bedrooms: null,
      bathrooms: null,
      parking: null,
    };

    // Inspection revealed: ul.col-12.is contains li items with small (label) and span (value)
    $("ul.is li").each((i, elem) => {
      const label = $(elem).find("small").text().trim().toUpperCase();
      const value = $(elem).find("span").text().trim();

      if (label.includes("ÁREA") || label.includes("M²")) {
        stats.area = value;
      } else if (label.includes("DORM")) {
        stats.bedrooms = value;
      } else if (label.includes("SUÍTE")) {
        // Use suites if needed
        if (!stats.bathrooms) stats.bathrooms = value;
      } else if (label.includes("VAGA")) {
        stats.parking = value;
      }
    });

    // Fallback if ul.is not found or empty
    if (!stats.area || !stats.bedrooms || !stats.parking) {
      $("small").each((i, elem) => {
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

    // Improved bathroom detection
    let bathroomCount = 0;
    const bathroomTypes = [
      "banheiro social",
      "lavabo",
      "wc de empregada",
      "banheiro auxiliar",
    ];

    // Check all li elements for specific bathroom types
    $("li").each((i, elem) => {
      const text = $(elem).text().trim().toLowerCase();
      if (bathroomTypes.some((t) => text.includes(t))) {
        bathroomCount++;
      }
    });

    // Add suite count explicitly if found in stats
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

  extractIPTU($) {
    let iptu = "N/D";
    $(".col-12.cts li, .item-detalhe-valor, li").each((i, elem) => {
      const text = $(elem).text().trim();
      const iptuMatch = text.match(/IPTU[:\s]*R\$\s*([\d.]+)/i);
      if (iptuMatch) {
        iptu = `R$ ${iptuMatch[1]}`;
        return false;
      }
    });
    return iptu;
  }

  extractCondominium($) {
    let condominium = "N/D";
    $(".col-12.cts li, .item-detalhe-valor, li").each((i, elem) => {
      const text = $(elem).text().trim();
      const condoMatch = text.match(/CONDOMÍNIO[:\s]*R\$\s*([\d.]+)/i);
      if (condoMatch) {
        condominium = `R$ ${condoMatch[1]}`;
        return false;
      }
    });
    return condominium;
  }

  extractFeatures($) {
    const features = [];

    // From inspection: .col-12.cts contains features
    $(".col-12.cts").each((i, elem) => {
      const title = $(elem).find("h2, h3").text().trim().toLowerCase();
      if (
        title.includes("características") ||
        title.includes("infraestrutura")
      ) {
        $(elem)
          .find("li")
          .each((j, li) => {
            const item = $(li).text().trim();
            if (item) features.push(item);
          });
      }
    });

    if (features.length === 0) {
      $(".caracteristicas-imovel li, [class*='caracteristica'] li").each(
        (i, elem) => {
          const item = $(elem).text().trim();
          if (item) features.push(item);
        },
      );
    }

    return { features, infrastructures: [] };
  }

  extractGallery($) {
    const gallery = [];
    // High-res images in fancybox
    $('a[data-fancybox="gallery"]').each((i, elem) => {
      const href = $(elem).attr("href");
      if (href && href.includes("cdn.vistahost.com.br")) {
        const fullSizeUrl = href.replace(/_p\.jpg$/, ".jpg");
        if (!gallery.includes(fullSizeUrl)) gallery.push(fullSizeUrl);
      }
    });

    if (gallery.length === 0) {
      $("img").each((i, elem) => {
        const src = $(elem).attr("src");
        if (src && src.includes("cdn.vistahost.com.br")) {
          const fullSizeUrl = src.replace(/_p\.jpg$/, ".jpg");
          if (!gallery.includes(fullSizeUrl)) gallery.push(fullSizeUrl);
        }
      });
    }
    return gallery;
  }

  calculatePricePerSqm(priceStr, area) {
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
      return `R$ ${pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²`;
    } catch (e) {
      return "N/D";
    }
  }

  async getContent(url) {
    const html = await this.http.get(url, "text");
    return html;
  }
}

module.exports = { MultimobMapper };
