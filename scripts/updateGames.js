import puppeteer from "puppeteer";
import fs from "fs";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function scrapeSpieltage() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Warten bis alle Spiele geladen sind
  await page.waitForSelector('lm-schedule-game-entry-row');

  const spieltage = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('lm-schedule-game-entry-row'));
    const spiele = [];

    rows.forEach(row => {
      const shadow = row.shadowRoot || row;

      // Alle Texte sammeln, leere Strings, Leerzeichen und unerwünschte Symbole ignorieren
      const texts = Array.from(shadow.querySelectorAll('*'))
        .map(el => el.textContent.trim())
        .filter(t => t && t !== '' && t !== 'circle' && t !== 'open_in_new');

      // Nur die ersten 5 Texte pro Spiel verwenden
      if (texts.length >= 5) {
        spiele.push({
          datum: texts[0],
          ort: texts[1],
          heimteam: texts[2],
          ergebnis: texts[3],
          auswaertsteam: texts[4]
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
