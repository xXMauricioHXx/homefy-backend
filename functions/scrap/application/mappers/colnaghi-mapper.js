const cheerio = require("cheerio");
const { scrapPage } = require("../../adapters/scrapper");

class ColnaghiMapper {
  async map(html, url) {
    return this.mapFromHtml(html, url);
  }

  mapFromHtml(html, url) {
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]')
        .attr("content")
        .replace(" - Colnaghi Imóveis", "") ||
      $("title").text().split("-")[0].trim().replace(" - Colnaghi Imóveis", "");
    const desc = $('meta[name="description"]').attr("content") || "N/D";
    const image = $('meta[property="og:image"]').attr("content") || "N/D";
    const city = $(".breadcrumbs ol li:nth-child(1)").text().trim();
    const neighborhood = $(".breadcrumbs ol li:nth-child(3)").text().trim();
    const description = $(".imovel-descricao").text().trim();
    const images = $(".main-photo img")
      .map((_, img) => img.attribs.src)
      .get();

    // Extract area/dorms from description meta if possible
    let area = "N/D";

    const areaMatch = desc.match(/(\d+)\s*m²/);
    if (areaMatch) area = areaMatch[1];

    const name = $(".header-section h1")
      .text()
      .replace("- Colnaghi Imóveis", "");

    const bedroomsText = $(
      ".imovel-caracteristicas .caracteristica--dorm .info",
    ).text();

    console.log("Match: ", bedroomsText.match(/\d+/g));
    const bedrooms = bedroomsText
      .match(/\d+/g)
      .reduce((acc, val) => Number(acc) + Number(val));

    console.log(bedrooms);

    const codeMatch = url ? url.match(/cl\d+/i) : null;
    const features = $(".features .feature")
      .map((_, elem) => {
        return $(elem).text().trim();
      })
      .get();

    const parkingText = $(".caracteristica--vagas .content .info")
      .text()
      .trim();
    const parking = parkingText.match(/\d+/)[0];
    const priceText = $(".imovel-price .value")
      .map((_, elem) => $(elem).text().trim())
      .get();

    console.log(priceText);

    return {
      brand: {
        name,
        location: `${neighborhood}, ${city}`,
        description: title,
      },
      property: {
        resume: title,
        description,
        reference: codeMatch ? codeMatch[0] : "N/D",
        mainImage: image,
        sideImages: images.slice(1, 3),
        gallery: images,
        features: features.slice(1, features.length),
        infrastructures: [],
        area,
        bedrooms,
        bathrooms: "N/D",
        condominium: "N/D",
        parking,
        iptu: "N/D",
        price: priceText[priceText.length - 1],
        pricePerSqm: "N/D",
      },
    };
  }

  calculatePricePerSqm(priceStr, area) {
    if (!priceStr || !area || priceStr === "N/D") return "N/D";
    try {
      // Clean price string: remove "R$", dots (thousands), and replace comma with dot (decimal)
      const cleanPriceStr = priceStr
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
      const numericPrice = parseFloat(cleanPriceStr);

      const numericArea =
        typeof area === "number"
          ? area
          : parseFloat(
              area
                .toString()
                .replace(",", ".")
                .replace(/[^\d.]/g, ""),
            );

      if (isNaN(numericPrice) || isNaN(numericArea) || numericArea === 0)
        return "N/D";

      const pricePerSqm = numericPrice / numericArea;
      return `R$ ${pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²`;
    } catch {
      return "N/D";
    }
  }

  emptyResult() {
    return {
      brand: { name: "N/D", location: "N/D", description: "N/D" },
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

  async getContent(url) {
    return await scrapPage(url);
  }
}

module.exports = { ColnaghiMapper };
