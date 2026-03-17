import puppeteer from "puppeteer";
import fs from "fs";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function scrapeSpieltage() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.waitForSelector('lm-schedule-game-entry-row');

  const spieltage = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('lm-schedule-game-entry-row'));
    const spiele = [];

    rows.forEach(row => {
      const shadow = row.shadowRoot || row;

      // Alle Kind-Elemente durchlaufen, relevante Texte sammeln
      const children = Array.from(shadow.children || []);
      const texts = [];
      children.forEach(el => {
        const t = el.textContent.trim();
        if (t && t !== '' && t !== 'circle' && t !== 'open_in_new') {
          texts.push(t);
        }
      });

      // Alle 5er-Gruppen als Spieltage speichern
      for (let i = 0; i <= texts.length - 5; i += 5) {
        spiele.push({
          datum: texts[i],
          ort: texts[i + 1],
          heimteam: texts[i + 2],
          ergebnis: texts[i + 3],
          auswaertsteam: texts[i + 4]
        });
      }
    });

    return spiele;
  });

  await browser.close();

  fs.writeFileSync("spieltage.json", JSON.stringify(spieltage, null, 2), "utf-8");
  console.log(`Erfolgreich ${spieltage.length} Spieltage gespeichert.`);
}

scrapeSpieltage().catch(err => {
  console.error("Fehler beim Scrapen:", err);
  process.exit(1);
});
