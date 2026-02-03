const cheerio = require("cheerio");

class FoxterMapper {
  map(html) {
    try {
      // Carrega o HTML no Cheerio para extração de dados
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
      const images = product.images?.data || [];

      const gallery = images.map((img) =>
        FoxterMapper.buildImageUrl(baseUrl, img.etag),
      );

      const mainImage = gallery[0] || "N/A";
      const sideImages = gallery.slice(1, 3);

      // Extrai dormitórios, banheiros, vagas e preço/m² do HTML usando Cheerio
      const bedrooms = FoxterMapper.extractBedrooms($);
      const bathrooms = FoxterMapper.extractBathrooms($);
      const parking = FoxterMapper.extractParking($);
      const pricePerSqm = FoxterMapper.extractPricePerSqm($);

      const city = FoxterMapper.getCity(product);

      const scrapedData = {
        brand: {
          name: product.developmentName || "Corretora",
          location: city || "N/A",
          description: product.h1 || product.title || "N/A",
        },
        property: {
          resume: product.h1 || product.title || "N/A",
          description: product.description || "N/A",
          reference: product.code?.toString() || "N/A",
          mainImage,
          sideImages,
          gallery,
          features: product.features?.slice(0, 10) || [],
          infrastructures: product.developmentFeatures?.slice(0, 10) || [],
          area: product.areaPrivate || product.areaTotal || "N/A",
          bedrooms,
          bathrooms,
          condominium: product.condominiumAmountValue || "N/A",
          parking,
          iptu: product.iptu || "N/A",
          price: FoxterMapper.formatPrice(product.saleValue),
          pricePerSqm,
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping do Foxter:", error);

      return {
        brand: {
          name: "N/A",
          location: "N/A",
          description: "N/A",
        },
        property: {
          resume: "N/A",
          description: "N/A",
          reference: "N/A",
          mainImage: "N/A",
          sideImages: [],
          gallery: [],
          features: [],
          infrastructures: [],
          area: "N/A",
          bedrooms: "N/A",
          bathrooms: "N/A",
          condominium: "N/A",
          parking: "N/A",
          iptu: "N/A",
          price: "N/A",
          pricePerSqm: "N/A",
        },
      };
    }
  }

  static buildImageUrl(baseUrl, etag, size = "1024/1") {
    if (!etag) return "N/A";
    return `${baseUrl}${size}/foxter/wm/${etag}`;
  }

  static formatPrice(value) {
    if (!value) return "N/A";
    const numericValue = value.replace(/\./g, "").replace(/,/g, ".");
    const number = parseFloat(numericValue);
    if (isNaN(number)) return value;
    return `R$ ${number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  static getCity(product) {
    const name = product.h1 || product.title || "N/A";

    return name.split("-")[1].trim();
  }

  static extractBedrooms($) {
    // Procura no #product-characteristics por texto que contenha "dorm"
    const characteristics = $("#product-characteristics");
    let bedrooms = "N/A";

    characteristics.find(".flex").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*dorm/i);
      if (match) {
        bedrooms = match[1];
        return false; // break
      }
    });

    return bedrooms;
  }

  static extractBathrooms($) {
    // Procura no #product-characteristics por texto que contenha "banheiro"
    const characteristics = $("#product-characteristics");
    let bathrooms = "N/A";

    characteristics.find(".flex").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*banheiro/i);
      if (match) {
        bathrooms = match[1];
        return false; // break
      }
    });

    return bathrooms;
  }

  static extractParking($) {
    // Procura no #product-characteristics por texto que contenha "vaga"
    const characteristics = $("#product-characteristics");
    let parking = "N/A";

    characteristics.find(".flex").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*vaga/i);
      if (match) {
        parking = match[1];
        return false; // break
      }
    });

    return parking;
  }

  static extractPricePerSqm($) {
    // Procura no #product-characteristics por texto que contenha "R$ ... /m²"
    const characteristics = $("#product-characteristics");
    let pricePerSqm = "N/A";

    characteristics.find(".flex").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/R\$\s*([\d.,]+)\s*\/m²/i);
      if (match) {
        pricePerSqm = `R$ ${match[1]}/m²`;
        return false; // break
      }
    });

    return pricePerSqm;
  }
}

module.exports = {
  FoxterMapper,
};
