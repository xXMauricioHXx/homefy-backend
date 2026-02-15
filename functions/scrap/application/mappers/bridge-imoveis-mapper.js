const { HttpAdapter } = require("../../adapters/http.adapter");

class BridgeImoveisMapper {
  constructor() {
    this.http = new HttpAdapter();
  }

  async map(html) {
    try {
      // Extract JSON-LD data from script tag
      const jsonLdMatch = html.match(
        /<script type="application\/ld\+json">(.*?)<\/script>/s,
      );

      if (!jsonLdMatch) {
        throw new Error(
          "Não foi possível encontrar os dados do Bridge Imóveis no HTML",
        );
      }

      const jsonLdData = JSON.parse(jsonLdMatch[1]);

      // Extract expandifyResponse data
      const expandifyMatch = html.match(
        /window\.expandifyResponse\s*=\s*({.*?});/s,
      );

      let expandifyData = null;
      if (expandifyMatch) {
        try {
          expandifyData = JSON.parse(expandifyMatch[1]);
        } catch (e) {
          console.warn("Não foi possível parsear expandifyResponse:", e);
        }
      }

      // Extract basic data from JSON-LD
      const name = jsonLdData.name || "N/D";
      const description = jsonLdData.description || "N/D";
      const price = jsonLdData.offers?.price || 0;
      const mainImage = jsonLdData.image || "N/D";

      // Extract characteristics from additionalProperty
      const characteristics = jsonLdData.additionalProperty || [];

      // Extract images from the HTML (look for gallery images)
      const gallery = this.extractGallery(html);

      // Extract location from expandifyResponse or parse from HTML
      let locationStr = "N/D";
      if (expandifyData?.property) {
        const { neighborhood, city, state } = expandifyData.property;
        locationStr = [neighborhood, city, state].filter((l) => l).join(", ");
      } else {
        // Try to extract from page title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          const title = titleMatch[1];
          // Extract location pattern like "Bela Vista, POA/RS"
          const locMatch = title.match(/([^,]+),\s*([^\/\-]+)\/([A-Z]{2})/i);
          if (locMatch) {
            locationStr = `${locMatch[1]}, ${locMatch[2]}, ${locMatch[3]}`;
          }
        }
      }

      // Extract reference code
      const reference =
        expandifyData?.property?.publicId?.toString() ||
        this.extractReference(html) ||
        "N/D";

      // Extract property features from HTML
      const features = this.extractFeatures(html);

      // Extract infrastructure from HTML
      const infrastructures = this.extractInfrastructure(html);

      // Extract IPTU and Condominium from HTML
      const iptu = this.extractIPTU(html);
      const condominium = this.extractCondominium(html);

      // Format price
      const formattedPrice = price
        ? `R$ ${price.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "N/D";

      // Calculate price per sqm
      const pricePerSqm = this.calculatePricePerSqm(price, features.area);

      const scrapedData = {
        brand: {
          name,
          location: locationStr,
          description: name,
        },
        property: {
          resume: name,
          description,
          reference,
          mainImage,
          sideImages: gallery.slice(1, 3),
          gallery,
          features:
            characteristics.slice(0, 10)?.map((item) => item?.name) || [],
          infrastructures,
          area: features.area || "N/D",
          bedrooms: features.bedrooms || "N/D",
          bathrooms: features.bathrooms || "N/D",
          condominium,
          parking: features.parking || "N/D",
          iptu,
          price: formattedPrice,
          pricePerSqm,
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping do Bridge Imóveis:", error);

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

  extractGallery(html) {
    const gallery = [];

    // Try to extract from image tags with specific patterns
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      // Filter for property images from CDN (exclude icons and logos)
      if (
        src.includes("cdn.vistahost.com.br") &&
        src.includes("bridgeco") &&
        !src.includes("icon") &&
        !src.includes("logo")
      ) {
        if (!gallery.includes(src)) {
          gallery.push(src);
        }
      }
    }

    // If no images found, try alternative patterns
    if (gallery.length === 0) {
      const altImgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
      while ((match = altImgRegex.exec(html)) !== null) {
        const src = match[1];
        if (
          (src.includes("bridgeimoveis") || src.includes("imobi")) &&
          !src.includes("/static/") &&
          !src.includes("/icons/") &&
          !src.includes("logo") &&
          src.match(/\.(jpg|jpeg|png|webp)/i)
        ) {
          if (!gallery.includes(src)) {
            gallery.push(src);
          }
        }
      }
    }

    return gallery;
  }

  extractFeatures(html) {
    const features = {
      area: null,
      bedrooms: null,
      bathrooms: null,
      parking: null,
    };

    // Extract area (m²)
    const areaMatch = html.match(/(\d+(?:\.\d+)?)\s*m²/i);
    if (areaMatch) {
      features.area = areaMatch[1];
    }

    // Extract bedrooms (dormitórios)
    const bedroomsMatch = html.match(/(\d+)\s*dorm/i);
    if (bedroomsMatch) {
      features.bedrooms = bedroomsMatch[1];
    }

    // Extract bathrooms (banheiros or suítes)
    const bathroomsMatch = html.match(/(\d+)\s*banh/i);
    if (bathroomsMatch) {
      features.bathrooms = bathroomsMatch[1];
    } else {
      // Try to extract from suites count as fallback
      const suitesMatch = html.match(/(\d+)\s*suíte/i);
      if (suitesMatch) {
        features.bathrooms = suitesMatch[1];
      }
    }

    // Extract parking (vagas)
    const parkingMatch = html.match(/(\d+)\s*vaga/i);
    if (parkingMatch) {
      features.parking = parkingMatch[1];
    }

    return features;
  }

  extractInfrastructure(html) {
    const infrastructures = [];

    // Look for infrastructure section
    const infraMatch = html.match(
      /Infraestrutura do Condomínio[^]*?<ul[^>]*>(.*?)<\/ul>/is,
    );

    if (infraMatch) {
      const liRegex = /<li[^>]*>(.*?)<\/li>/g;
      let match;

      while ((match = liRegex.exec(infraMatch[1])) !== null) {
        const text = match[1].replace(/<[^>]+>/g, "").trim();
        if (text) {
          infrastructures.push(text);
        }
      }
    }

    return infrastructures;
  }

  extractIPTU(html) {
    const iptuMatch = html.match(/IPTU:\s*R\$\s*([\d.,]+)/i);
    if (iptuMatch) {
      return `R$ ${iptuMatch[1]}`;
    }
    return "N/D";
  }

  extractCondominium(html) {
    const condoMatch = html.match(/Condomínio:\s*R\$\s*([\d.,]+)/i);
    if (condoMatch) {
      return `R$ ${condoMatch[1]}`;
    }
    return "N/D";
  }

  extractReference(html) {
    // Try to extract from URL or page content
    const refMatch = html.match(/imovel\/(\d+)\//);
    if (refMatch) {
      return refMatch[1];
    }
    return null;
  }

  calculatePricePerSqm(price, area) {
    if (!price || !area || area === 0) {
      return "N/D";
    }

    try {
      const numericArea = parseFloat(area);
      const pricePerSqm = price / numericArea;
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
  BridgeImoveisMapper,
};
