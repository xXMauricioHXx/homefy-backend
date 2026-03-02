import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class CreditoRealMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
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

      const sobreImovel = imovel.sobreImovel || {};
      const features = imovel.features || {};
      const values = imovel.values || {};
      const location = imovel.location || {};
      const characteristics: string[] = imovel.characteristics || [];
      const images: Array<{ src?: string; url?: string }> = imovel.images || [];

      const gallery = images
        .map((img) => img.src || img.url || "")
        .filter((url) => url);

      const mainImage = gallery[0] || "N/D";
      const sideImages = gallery.slice(1, 3);

      const price = values.value
        ? `R$ ${values.value.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "N/D";

      const pricePerSqm = this.calculatePricePerSqm(
        values.value,
        features.area,
      );

      const locationStr = [location.neighborhood, location.city, location.state]
        .filter((l: string) => l)
        .join(", ");

      return {
        source: {
          providerKey: "credito_real",
          url,
        },
        brand: {
          name: "Credito Real",
          location: locationStr || "N/D",
          headline: sobreImovel.type || "Imóvel",
        },
        property: {
          title: `${sobreImovel.type || "Imóvel"} em ${locationStr}`,
          description: sobreImovel.description || "N/D",
          features: characteristics.slice(0, 10),
          infrastructures: [],
          areaSqm: features.area ? features.area.toString() : "N/D",
          bedrooms: features.rooms ? features.rooms.toString() : "N/D",
          bathrooms: features.bathrooms ? features.bathrooms.toString() : "N/D",
          parking: features.parking ? features.parking.toString() : "N/D",
          pricing: {
            priceText: price,
            pricePerSqmText: pricePerSqm,
            condominiumText: "N/D",
            iptuText: "N/D",
          },
        },
        images: gallery,
      };
    } catch (error) {
      console.error("Erro ao fazer scraping do Credito Real:", error);
      return CreditoRealMapper.emptyResult();
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

  private calculatePricePerSqm(price: number, area: number): string {
    if (!price || !area || area === 0) return "N/D";
    try {
      const pricePerSqm = price / area;
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
        providerKey: "credito_real",
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
