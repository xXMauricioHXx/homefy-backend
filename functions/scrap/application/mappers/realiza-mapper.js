const cheerio = require("cheerio");
const { HttpAdapter } = require("../../adapters/http.adapter");

class RealizaMapper {
  constructor() {
    this.http = new HttpAdapter();
  }

  async map(html) {
    try {
      // Carrega o HTML no Cheerio para extração de dados
      const $ = cheerio.load(html);

      // Extrai informações da marca/corretora
      const brandName =
        $('meta[property="og:site_name"]').attr("content") || "Realiza Imóveis";

      // Extrai localização do breadcrumb ou meta tags
      const location = RealizaMapper.extractLocation($);

      // Extrai descrição do imóvel
      const description =
        $('meta[name="description"]').attr("content") || "N/D";

      // Extrai o título/resumo do imóvel
      const resume = $("h1").first().text().trim() || "N/D";

      // Extrai o código de referência
      const reference = RealizaMapper.extractReference($);

      // Extrai imagens
      const gallery = RealizaMapper.extractGallery($);
      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      // Extrai características do imóvel
      const features = RealizaMapper.extractFeatures($);
      const infrastructures = RealizaMapper.extractInfrastructures($);

      // Extrai informações dos itens de valor
      const area = RealizaMapper.extractArea($);
      const bedrooms = RealizaMapper.extractBedrooms($);
      const bathrooms = RealizaMapper.extractBathrooms($);
      const parking = RealizaMapper.extractParking($);

      // Extrai valores financeiros
      const price = RealizaMapper.extractPrice($);
      const condominium = RealizaMapper.extractCondominium($);
      const iptu = RealizaMapper.extractIPTU($);
      const pricePerSqm = RealizaMapper.calculatePricePerSqm(price, area);

      const scrapedData = {
        brand: {
          name: brandName,
          location: location || "N/D",
          description: resume,
        },
        property: {
          resume,
          description,
          reference,
          mainImage,
          sideImages,
          gallery,
          features,
          infrastructures,
          area,
          bedrooms,
          bathrooms,
          condominium,
          parking,
          iptu,
          price,
          pricePerSqm,
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping do Realiza:", error);

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

  /**
   * Extrai a localização do imóvel a partir dos breadcrumbs
   */
  static extractLocation($) {
    const breadcrumbs = $(".brands li");
    let location = "N/D";

    breadcrumbs.each((i, elem) => {
      const text = $(elem).text().trim();
      // Procura por cidade (geralmente é o terceiro ou quarto item)
      if (i === 2 || i === 3) {
        if (text && text !== "Venda" && text !== "Início") {
          location = text;
          return false; // break
        }
      }
    });

    return location;
  }

  /**
   * Extrai o código de referência do imóvel
   */
  static extractReference($) {
    // Procura no breadcrumb ou no título
    const breadcrumbs = $(".brands li");
    let reference = "N/D";

    breadcrumbs.each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/Código\s+(\d+)/i);
      if (match) {
        reference = match[1];
        return false; // break
      }
    });

    // Se não encontrou no breadcrumb, tenta no atributo data-codigo
    if (reference === "N/D") {
      const dataCode = $("[data-codigo]").first().attr("data-codigo");
      if (dataCode) {
        reference = dataCode;
      }
    }

    return reference;
  }

  /**
   * Extrai todas as imagens da galeria
   */
  static extractGallery($) {
    const images = [];

    // Procura por imagens na galeria (thumbs)
    $(".thumbs li figure a").each((i, elem) => {
      const href = $(elem).attr("href");
      if (href && href.startsWith("http")) {
        images.push(href);
      }
    });

    return images;
  }

  /**
   * Extrai características do imóvel
   */
  static extractFeatures($) {
    const features = [];

    // Procura por lista de características (pode variar dependendo da estrutura)
    $(".infra ul li, .features ul li, .caracteristicas li").each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && features.length < 10) {
        features.push(text);
      }
    });

    return features;
  }

  /**
   * Extrai infraestruturas/amenidades do imóvel
   */
  static extractInfrastructures($) {
    const infrastructures = [];

    // Procura por lista de infraestruturas
    $(".infrastructures ul li, .amenidades li, .lazer li").each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && infrastructures.length < 10) {
        infrastructures.push(text);
      }
    });

    return infrastructures;
  }

  /**
   * Extrai a área do imóvel
   */
  static extractArea($) {
    let area = "N/D";

    // Procura nos itens de valor
    $(".va-itens li").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)m²/i);
      if (match) {
        area = match[1];
        return false; // break no primeiro encontrado
      }
    });

    return area;
  }

  /**
   * Extrai o número de quartos
   */
  static extractBedrooms($) {
    let bedrooms = "N/D";

    // Procura nos itens de valor
    $(".va-itens li").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*quarto/i);
      if (match) {
        bedrooms = match[1];
        return false; // break
      }
    });

    return bedrooms;
  }

  /**
   * Extrai o número de banheiros
   */
  static extractBathrooms($) {
    let bathrooms = "N/D";

    // Procura nos itens de valor
    $(".va-itens li").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*banheiro/i);
      if (match) {
        bathrooms = match[1];
        return false; // break
      }
    });

    return bathrooms;
  }

  /**
   * Extrai o número de vagas de garagem
   */
  static extractParking($) {
    let parking = "N/D";

    // Procura nos itens de valor
    $(".va-itens li").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/(\d+)\s*vaga/i);
      if (match) {
        parking = match[1];
        return false; // break
      }
    });

    return parking;
  }

  /**
   * Extrai o preço do imóvel
   */
  static extractPrice($) {
    let price = "N/D";

    // Procura nos itens de valor
    $(".va-itens li").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/R\$\s*([\d.,]+)/i);
      if (match) {
        price = `R$ ${match[1]}`;
        return false; // break
      }
    });

    return price;
  }

  /**
   * Extrai o valor do condomínio
   */
  static extractCondominium($) {
    let condominium = "N/D";

    // Procura por texto que contenha "condomínio"
    $("li, p, span, div").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/condom[ií]nio[:\s]*R\$\s*([\d.,]+)/i);
      if (match) {
        condominium = `R$ ${match[1]}`;
        return false; // break
      }
    });

    return condominium;
  }

  /**
   * Extrai o valor do IPTU
   */
  static extractIPTU($) {
    let iptu = "N/D";

    // Procura por texto que contenha "IPTU"
    $("li, p, span, div").each((i, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/IPTU[:\s]*R\$\s*([\d.,]+)/i);
      if (match) {
        iptu = `R$ ${match[1]}`;
        return false; // break
      }
    });

    return iptu;
  }

  /**
   * Calcula o preço por metro quadrado
   */
  static calculatePricePerSqm(price, area) {
    if (price === "N/D" || area === "N/D") {
      return "N/D";
    }

    try {
      // Remove formatação do preço
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
      console.error("Erro ao calcular preço por m²:", error);
      return "N/D";
    }
  }

  async getContent(url) {
    return await this.http.get(url, "text");
  }
}

module.exports = {
  RealizaMapper,
};
