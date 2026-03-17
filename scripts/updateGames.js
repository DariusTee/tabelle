import puppeteer from "puppeteer";
import fs from "fs";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function scrapeSpieltage() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Warte, bis die Web Components vollständig geladen sind
  await page.waitForSelector('lm-schedule-game-entry-row');

  const spieltage = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('lm-schedule-game-entry-row'));
    return rows.map(row => {
      // jedes row ist ein Custom Element; wir greifen auf shadow DOM zu, falls nötig
      const shadow = row.shadowRoot || row; // fallback, falls kein shadow DOM
      const datum = shadow.querySelector('div[data-type="date"]')?.textContent.trim() || '';
      const ort = shadow.querySelector('div[data-type="place"]')?.textContent.trim() || '';
      const heimteam = shadow.querySelector('div[data-type="home-team"]')?.textContent.trim() || '';
      const ergebnis = shadow.querySelector('div[data-type="score"]')?.textContent.trim() || '';
      const auswaertsteam = shadow.querySelector('div[data-type="away-team"]')?.textContent.trim() || '';

      return { datum, ort, heimteam, ergebnis, auswaertsteam };
    }).filter(item => item.datum); // filter leere Einträge
  });

  await browser.close();

  fs.writeFileSync("spieltage.json", JSON.stringify(spieltage, null, 2), "utf-8");
  console.log(`Erfolgreich ${spieltage.length} Spieltage gespeichert.`);
}

scrapeSpieltage().catch(err => {
  console.error("Fehler beim Scrapen:", err);
  process.exit(1);
});
