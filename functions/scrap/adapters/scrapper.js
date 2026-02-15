const puppeteer = require("puppeteer");

const scrapPage = async (url) => {
  const browser = await puppeteer.launch({
    headless: true, // true = produção
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // importante se rodar em servidor
  });

  const page = await browser.newPage();

  // Simula navegador real (evita bloqueio simples)
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  );

  await page.goto(url, {
    waitUntil: "networkidle2", // espera parar requisições
    timeout: 60000,
  });

  // Pega o HTML final já renderizado
  const html = await page.content();

  await browser.close();

  return html;
};

module.exports = { scrapPage };
