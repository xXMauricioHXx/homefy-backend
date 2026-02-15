const { HttpAdapter } = require("../../adapters/http.adapter");

class CreditoRealMapper {
  constructor() {
    this.http = new HttpAdapter();
  }

  async map(html) {
    try {
      // Extract JSON data from __NEXT_DATA__ script tag
      const scriptMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
      );

      if (!scriptMatch) {
        throw new Error(
          "Não foi possível encontrar os dados do Credito Real no HTML",
        );
      }

      const jsonData = JSON.parse(scriptMatch[1]);
      const imovel = jsonData.props?.pageProps?.imovel;

      if (!imovel) {
        throw new Error("Estrutura de dados inválida no HTML do Credito Real");
      }

      // Extract data from structured JSON
      const sobreImovel = imovel.sobreImovel || {};
      const features = imovel.features || {};
      const values = imovel.values || {};
      const location = imovel.location || {};
      const characteristics = imovel.characteristics || [];
      const images = imovel.images || [];

      // Build gallery from images
      const gallery = images
        .map((img) => img.src || img.url)
        .filter((url) => url);

      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      // Format price
      const price = values.value
        ? `R$ ${values.value.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "N/D";

      // Calculate price per sqm
      const pricePerSqm = this.calculatePricePerSqm(
        values.value,
        features.area,
      );

      // Build location string
      const locationStr = [location.neighborhood, location.city, location.state]
        .filter((l) => l)
        .join(", ");

      const scrapedData = {
        brand: {
          name: "Credito Real",
          location: locationStr || "N/D",
          description: sobreImovel.type || "Imóvel",
        },
        property: {
          resume: `${sobreImovel.type || "Imóvel"} em ${locationStr}`,
          description: sobreImovel.description || "N/D",
          reference: sobreImovel.code || "N/D",
          mainImage,
          sideImages,
          gallery,
          features: characteristics.slice(0, 10),
          infrastructures: [],
          area: features.area ? features.area.toString() : "N/D",
          bedrooms: features.rooms ? features.rooms.toString() : "N/D",
          bathrooms: features.bathrooms ? features.bathrooms.toString() : "N/D",
          condominium: "N/D", // Not available in the data
          parking: features.parking ? features.parking.toString() : "N/D",
          iptu: "N/D", // Not available in the data
          price,
          pricePerSqm,
        },
      };

      return scrapedData;
    } catch (error) {
      console.error("Erro ao fazer scraping do Credito Real:", error);

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

  calculatePricePerSqm(price, area) {
    if (!price || !area || area === 0) {
      return "N/D";
    }

    try {
      const pricePerSqm = price / area;
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
  CreditoRealMapper,
};
