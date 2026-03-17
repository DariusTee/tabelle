import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407' },
  { name: 'Regionalliga West', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/421' },
  { name: 'Bundesliga Damen', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/411' },
  { name: 'NRW C-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/416' },
  { name: 'NRW D-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/417' },
  { name: 'NRW Rookies', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/418' },
];

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    await Promise.all(
      ligas.map(async (liga) => {
        const page = await browser.newPage();
        console.log(`Lade Spielplan: ${liga.name}`);

        await page.goto(liga.url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

        const games = await page.$$eval('lm-schedule-game-entry-row', (rows) =>
          rows.map((row) => {
            const text = row.innerText.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');

            const dateMatch = text.match(/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/);
            const resultMatch = text.match(/\d+\s*:\s*\d+(?:\s*n\.V\.)?/);

            const date = dateMatch ? dateMatch[0] : '';
            const result = resultMatch ? resultMatch[0] : '';

            let cleaned = text
              .replace(date, '')
              .replace(result, '')
              .replace(/circle|check_indeterminate_small|open_in_new/g, '')
              .trim();

            const parts = cleaned.split(/\s{2,}|\s(?=[A-ZÄÖÜ])/);

            const location = parts[0] || '';
            const homeTeam = parts[1] || '';
            const awayTeam = parts[2] || '';

            return {
              date,
              location,
              homeTeam,
              awayTeam,
              result,
            };
          })
        );

        const fileName = liga.name.replace(/\s+/g, '_') + '_spiele.json';
        const dataPath = path.join(process.cwd(), 'public/data', fileName);

        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

        console.log(`Spielplan gespeichert: ${fileName} (${games.length} Spiele)`);

        await page.close();
      })
    );

    await browser.close();
    console.log('✅ Alle Spielpläne erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Spielpläne:', err);
    process.exit(1);
  }
})();
