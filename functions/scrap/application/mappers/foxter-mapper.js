class FoxterMapper {
  map(html) {
    try {
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

      const parkingMatch = product.bedrooms?.match(/(\d+)\s*vaga/i);
      const parking = parkingMatch ? parkingMatch[1] : "N/A";

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
          condominium: product.condominiumAmountValue || "N/A",
          parking,
          iptu: product.iptu || "N/A",
          price: FoxterMapper.formatPrice(product.saleValue),
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
          condominium: "N/A",
          parking: "N/A",
          iptu: "N/A",
          price: "N/A",
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
}

module.exports = {
  FoxterMapper,
};
