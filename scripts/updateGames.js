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

  for (const liga of ligas) {
    const page = await browser.newPage();
    console.log(`Lade Tabelle: ${liga.name}`);

    await page.goto(liga.url, { waitUntil: 'networkidle2' });

    // Warte, bis mindestens eine Row mit Shadow DOM Inhalte hat
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('lm-schedule-game-entry-row'))
        .some(row => row.shadowRoot && row.shadowRoot.children.length > 0),
      { timeout: 120000 }
    );

    // Hole alle Row-Handles
    const rowsHandles = await page.$$('lm-schedule-game-entry-row');
    const spiele = [];

    for (const rowHandle of rowsHandles) {
      const shadowRootHandle = await rowHandle.evaluateHandle((row) => row.shadowRoot || row);
      const childHandles = await shadowRootHandle.$$(':scope > *');

      const texts = [];
      for (const child of childHandles) {
        const t = (await (await child.getProperty('textContent')).jsonValue()).trim();
        if (
          t &&
          t !== 'circle' &&
          t !== 'open_in_new' &&
          !['Datum','Spielort','Heim','Resultat','Gast','n.V.','n.P.'].includes(t)
        ) {
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

    await page.close();

    const fileName = liga.name.replace(/\s+/g, '_') + '.json';
    const dataPath = path.join(process.cwd(), 'public/data', fileName);
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(spiele, null, 2), 'utf-8');

    console.log(`Tabelle gespeichert: ${fileName} (${spiele.length} Spieltage)`);
  }

  await browser.close();
  console.log('✅ Alle Ligen erfolgreich aktualisiert!');
})();
