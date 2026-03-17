import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const url = 'https://spielplan.rollhockey.de/lm/saison/29/liga/407';
  console.log(`Lade Tabelle: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Warten, bis die Spielelemente erschienen sind
  await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 30000 });

  const games = await page.$$eval('lm-schedule-game-entry-row', rows => {
    return rows.map(row => {
      // alle direkten div Kinder
      const divs = Array.from(row.querySelectorAll('div'));

      // Nur die ersten 5 Blöcke verwenden (Datum, Ort, Heim, Ergebnis, Gast)
      const texts = divs.slice(0, 5).map(div =>
        // sauberer Text, keine Icons oder Buttons
        div.innerText
          .replace(/\s+/g, ' ')
          .trim()
      );

      return {
        date: texts[0] || '',
        location: texts[1] || '',
        homeTeam: texts[2] || '',
        result: texts[3] || '',
        awayTeam: texts[4] || ''
      };
    });
  });

  // Optional speichern
  const filePath = path.join(process.cwd(), 'bundesliga_407_spiele.json');
  fs.writeFileSync(filePath, JSON.stringify(games, null, 2), 'utf‑8');

  console.log(`Spiele extrahiert: ${games.length}`);
  await browser.close();
})();
