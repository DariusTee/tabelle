import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407' },
  // weitere Ligen...
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const liga of ligas) {
    const page = await browser.newPage();
    console.log(`Lade Spiele: ${liga.name}`);
    await page.goto(liga.url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 30000 });

    const games = await page.$$eval('lm-schedule-game-entry-row', rows => {
      return Array.from(rows).map(row => {
        const divs = row.querySelectorAll(':scope > div');

        // Hilfsfunktion: nur reinen Text der Zelle, ignoriert Icons/HTML
        const getText = div => {
          return Array.from(div.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE) // nur Textknoten
            .map(n => n.textContent.trim())
            .join(' ');
        };

        return {
          date: divs[0] ? getText(divs[0]) : '',
          location: divs[1] ? getText(divs[1]) : '',
          homeTeam: divs[2] ? getText(divs[2]) : '',
          result: divs[3] ? getText(divs[3]) : '',
          awayTeam: divs[4] ? getText(divs[4]) : '',
        };
      });
    });

    const fileName = liga.name.replace(/\s+/g, '_') + '.json';
    const dataPath = path.join(process.cwd(), 'public/data', fileName);
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

    console.log(`Spiele gespeichert: ${fileName} (${games.length} Spiele)`);
    await page.close();
  }

  await browser.close();
  console.log('✅ Alle Ligen erfolgreich aktualisiert!');
})();
