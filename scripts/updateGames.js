import puppeteer from "puppeteer";
import fs from "fs";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function scrapeSpieltage() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const spieltage = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div.grid.grid-cols-6.lg\\:grid-cols-12.gap-y-4.items-center.text-center.bg-white.shadow-xl'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('div')).map(div => div.textContent.trim());
      if (cells.length >= 5) {
        return {
          datum: cells[0],
          ort: cells[1],
          heimteam: cells[2],
          ergebnis: cells[3],
          auswaertsteam: cells[4]
        };
      }
      return null;
    }).filter(item => item !== null);
  });

  await browser.close();

  fs.writeFileSync("spieltage.json", JSON.stringify(spieltage, null, 2), "utf-8");
  console.log(`Erfolgreich ${spieltage.length} Spieltage gespeichert.`);
}

scrapeSpieltage().catch(err => {
  console.error("Fehler beim Scrapen:", err);
  process.exit(1);
});
