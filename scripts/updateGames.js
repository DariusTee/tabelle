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
    console.log(`Lade Spielplan: ${liga.name}`);
    await page.goto(liga.url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

    const games = await page.$$eval('lm-schedule-game-entry-row', rows =>
      rows.map(row => {
        const divs = row.querySelectorAll('div');
        return {
          date: divs[0]?.innerText.trim() || '',
          location: divs[1]?.innerText.trim() || '',
          homeTeam: divs[2]?.innerText.trim() || '',
          result: divs[3]?.innerText.trim() || '',
          awayTeam: divs[4]?.innerText.trim() || '',
        };
      })
    );

    const fileName = liga.name.replace(/\s+/g, '_') + '_spiele.json';
    const dataPath = path.join(process.cwd(), 'public/data', fileName);
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

    console.log(`Spielplan gespeichert: ${fileName} (${games.length} Spiele)`);
    await page.close();
  }

  await browser.close();
  console.log('✅ Alle Spielpläne erfolgreich aktualisiert!');
})();
