import * as cheerio from "cheerio";
import { PropertyMapper } from "./PropertyMapper";
import { ScrapedData } from "./ScrapedPropertySchema";
import puppeteer from "puppeteer";

export class ColnaghiMapper implements PropertyMapper {
  async map(html: string, url: string): Promise<ScrapedData> {
    try {
      return this.mapFromHtml(html, url);
    } catch (error) {
      console.error("Erro ao fazer scraping do Colnaghi:", error);
      return ColnaghiMapper.emptyResult();
    }
  }

  private mapFromHtml(html: string, url: string): ScrapedData {
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]')
        .attr("content")
        ?.replace(" - Colnaghi Imóveis", "") ||
      $("title").text().split("-")[0].trim().replace(" - Colnaghi Imóveis", "");
    const desc = $('meta[name="description"]').attr("content") || "N/D";
    const image = $('meta[property="og:image"]').attr("content") || "N/D";
    const city = $(".breadcrumbs ol li:nth-child(1)").text().trim();
    const neighborhood = $(".breadcrumbs ol li:nth-child(3)").text().trim();
    const description = $(".imovel-descricao").text().trim();
    const images = $(".main-photo img")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((_: number, img: any) => $(img).attr("src") || "")
      .get() as string[];

    let area = "N/D";
    const areaMatch = desc.match(/(\d+)\s*m²/);
    if (areaMatch) area = areaMatch[1];

    const name = $(".header-section h1")
      .text()
      .replace("- Colnaghi Imóveis", "");

    const bedroomsText = $(
      ".imovel-caracteristicas .caracteristica--dorm .info",
    ).text();

    const bedroomsMatches = bedroomsText.match(/\d+/g);
    const bedrooms = bedroomsMatches
      ? bedroomsMatches
          .reduce((acc, val) => Number(acc) + Number(val), 0)
          .toString()
      : "N/D";

    const codeMatch = url ? url.match(/cl\d+/i) : null;
    const features = $(".features .feature")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((_: number, elem: any) => $(elem).text().trim())
      .get() as string[];

    const parkingText = $(".caracteristica--vagas .content .info")
      .text()
      .trim();
    const parkingMatch = parkingText.match(/\d+/);
    const parking = parkingMatch ? parkingMatch[0] : "N/D";

    const priceText = $(".imovel-price .value")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((_: number, elem: any) => $(elem).text().trim())
      .get() as string[];

    return {
      source: {
        providerKey: "colnaghi",
        url,
      },
      brand: {
        name,
        location: `${neighborhood}, ${city}`,
        headline: title || "N/D",
      },
      details: {
        title: title || "N/D",
        description: description || "N/D",
        features: features.slice(1, features.length),
        infrastructures: [],
        areaSqm: area,
        bedrooms,
        bathrooms: "N/D",
        parking,
      },
      pricing: {
        priceText: priceText[priceText.length - 1] || "N/D",
        pricePerSqmText: "N/D",
        condominiumText: "N/D",
        iptuText: "N/D",
      },
      images,
    };
  }

  async getContent(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const html = await page.content();

    await browser.close();

    return html;
  }

  private static emptyResult(): ScrapedData {
    return {
      source: {
        providerKey: "colnaghi",
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
