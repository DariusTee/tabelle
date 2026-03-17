import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407' },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.goto(ligas[0].url, { waitUntil: 'networkidle2' });
  await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

  // Hole alle Row-Handles
  const rowsHandles = await page.$$('lm-schedule-game-entry-row');
  const spiele = [];

  for (const rowHandle of rowsHandles) {
    // Shadow Root auslesen
    const shadowRootHandle = await rowHandle.evaluateHandle((row) => row.shadowRoot || row);
    const childHandles = await shadowRootHandle.$$(':scope > *');

    const texts = [];
    for (const child of childHandles) {
      const t = (await (await child.getProperty('textContent')).jsonValue()).trim();
      if (t && t !== 'circle' && t !== 'open_in_new' && !['Datum','Spielort','Heim','Resultat','Gast','n.V.','n.P.'].includes(t)) {
        texts.push(t);
      }
    }

    // Jede 5er-Gruppe = ein Spiel
    for (let i = 0; i <= texts.length - 5; i += 5) {
      spiele.push({
        datum: texts[i],
        ort: texts[i + 1],
        heimteam: texts[i + 2],
        ergebnis: texts[i + 3],
        auswaertsteam: texts[i + 4],
      });
    }
  }

  await browser.close();

  const fileName = '1._Bundesliga_Herren.json';
  const dataPath = path.join(process.cwd(), 'public/data', fileName);
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(spiele, null, 2), 'utf-8');

  console.log(`Tabelle gespeichert: ${fileName} (${spiele.length} Spieltage)`);
})();
