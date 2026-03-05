import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";

export class BridgeImoveisMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      const jsonLdMatch = html.match(
        /<script type="application\/ld\+json">(.*?)<\/script>/s,
      );

      if (!jsonLdMatch) {
        throw new Error(
          "Não foi possível encontrar os dados do Bridge Imóveis no HTML",
        );
      }

      const jsonLdData = JSON.parse(jsonLdMatch[1]);

      const expandifyMatch = html.match(
        /window\.expandifyResponse\s*=\s*({.*?});/s,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let expandifyData: any = null;
      if (expandifyMatch) {
        try {
          expandifyData = JSON.parse(expandifyMatch[1]);
        } catch (e) {
          console.warn("Não foi possível parsear expandifyResponse:", e);
        }
      }

      const name: string = jsonLdData.name || "N/D";
      const description: string = jsonLdData.description || "N/D";
      const price: number = jsonLdData.offers?.price || 0;

      const characteristics: Array<{ name: string }> =
        jsonLdData.additionalProperty || [];

      const gallery = this.extractGallery(html);

      let locationStr = "N/D";
      if (expandifyData?.property) {
        const { neighborhood, city, state } = expandifyData.property;
        locationStr = [neighborhood, city, state].filter((l) => l).join(", ");
      } else {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          const title = titleMatch[1];
          const locMatch = title.match(/([^,]+),\s*([^/-]+)\/([A-Z]{2})/i);
          if (locMatch) {
            locationStr = `${locMatch[1]}, ${locMatch[2]}, ${locMatch[3]}`;
          }
        }
      }

      const reference: string =
        expandifyData?.property?.publicId?.toString() ||
        this.extractReference(html) ||
        "N/D";

      const features = this.extractFeatures(html);
      const infrastructures = this.extractInfrastructure(html);
      const iptu = this.extractIPTU(html);
      const condominium = this.extractCondominium(html);

      const formattedPrice = price
        ? `R$ ${price.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "N/D";

      const pricePerSqm = this.calculatePricePerSqm(price, features.area);

      return {
        source: {
          providerKey: "bridge_imoveis",
          url,
        },
        brand: {
          name,
          location: locationStr,
          headline: name,
        },
        details: {
          title: name,
          description,
          features:
            characteristics.slice(0, 10)?.map((item) => item?.name) || [],
          infrastructures,
          areaSqm: features.area || "N/D",
          bedrooms: features.bedrooms || "N/D",
          bathrooms: features.bathrooms || "N/D",
          parking: features.parking || "N/D",
        },
        pricing: {
          priceText: formattedPrice,
          pricePerSqmText: pricePerSqm,
          condominiumText: condominium,
          iptuText: iptu,
        },
        images: gallery,
      };
    } catch (error) {
      console.error("Erro ao fazer scraping do Bridge Imóveis:", error);
      return BridgeImoveisMapper.emptyResult();
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

  private extractGallery(html: string): string[] {
    const gallery: string[] = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (
        src.includes("cdn.vistahost.com.br") &&
        src.includes("bridgeco") &&
        !src.includes("icon") &&
        !src.includes("logo")
      ) {
        if (!gallery.includes(src)) gallery.push(src);
      }
    }

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
          if (!gallery.includes(src)) gallery.push(src);
        }
      }
    }

    return gallery;
  }

  private extractFeatures(html: string): {
    area: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    parking: string | null;
  } {
    const features: {
      area: string | null;
      bedrooms: string | null;
      bathrooms: string | null;
      parking: string | null;
    } = { area: null, bedrooms: null, bathrooms: null, parking: null };

    const areaMatch = html.match(/(\d+(?:\.\d+)?)\s*m²/i);
    if (areaMatch) features.area = areaMatch[1];

    const bedroomsMatch = html.match(/(\d+)\s*dorm/i);
    if (bedroomsMatch) features.bedrooms = bedroomsMatch[1];

    const bathroomsMatch = html.match(/(\d+)\s*banh/i);
    if (bathroomsMatch) {
      features.bathrooms = bathroomsMatch[1];
    } else {
      const suitesMatch = html.match(/(\d+)\s*suíte/i);
      if (suitesMatch) features.bathrooms = suitesMatch[1];
    }

    const parkingMatch = html.match(/(\d+)\s*vaga/i);
    if (parkingMatch) features.parking = parkingMatch[1];

    return features;
  }

  private extractInfrastructure(html: string): string[] {
    const infrastructures: string[] = [];
    const infraMatch = html.match(
      /Infraestrutura do Condomínio[^]*?<ul[^>]*>(.*?)<\/ul>/is,
    );

    if (infraMatch) {
      const liRegex = /<li[^>]*>(.*?)<\/li>/g;
      let match;
      while ((match = liRegex.exec(infraMatch[1])) !== null) {
        const text = match[1].replace(/<[^>]+>/g, "").trim();
        if (text) infrastructures.push(text);
      }
    }

    return infrastructures;
  }

  private extractIPTU(html: string): string {
    const iptuMatch = html.match(/IPTU:\s*R\$\s*([\d.,]+)/i);
    if (iptuMatch) return `R$ ${iptuMatch[1]}`;
    return "N/D";
  }

  private extractCondominium(html: string): string {
    const condoMatch = html.match(/Condomínio:\s*R\$\s*([\d.,]+)/i);
    if (condoMatch) return `R$ ${condoMatch[1]}`;
    return "N/D";
  }

  private extractReference(html: string): string | null {
    const refMatch = html.match(/imovel\/(\d+)\//);
    if (refMatch) return refMatch[1];
    return null;
  }

  private calculatePricePerSqm(price: number, area: string | null): string {
    if (!price || !area || parseFloat(area) === 0) return "N/D";
    try {
      const numericArea = parseFloat(area);
      const pricePerSqm = price / numericArea;
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
        providerKey: "bridge_imoveis",
        url: "",
      },
      brand: { name: "N/D", location: "N/D", headline: "N/D" },
      details: {
        title: "N/D",
        description: "N/D",
        features: [],
        infrastructures: [],
        areaSqm: "N/D",
        bedrooms: "N/D",
        bathrooms: "N/D",
        parking: "N/D",
      },
      pricing: {
        priceText: "N/D",
        pricePerSqmText: "N/D",
        condominiumText: "N/D",
        iptuText: "N/D",
      },
      images: [],
    };
  }
}
