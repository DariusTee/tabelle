import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = 'https://spielplan.rollhockey.de/lm/saison/29/liga/407';

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    console.log(`Lade Spielplan von ${url} ...`);

    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('lm-schedule-game-entry-row');

    const spiele = await page.evaluate(() => {
      const rows = document.querySelectorAll('lm-schedule-game-entry-row');

      return Array.from(rows).map(row => {
        const grid = row.querySelector('.grid');
        if (!grid) return null;

        const date = grid.querySelector('div.col-span-2:nth-child(1)')?.innerText.trim() || '';
        const location = grid.querySelector('div.col-span-2:nth-child(2)')?.innerText.trim() || '';
        const homeTeam = grid.querySelector('div.col-span-2:nth-child(3)')?.innerText.trim() || '';
        const result = grid.querySelector('div:nth-child(4)')?.innerText.trim() || '';
        const awayTeam = grid.querySelector('div.col-span-2:nth-child(5)')?.innerText.trim() || '';

        return { date, location, homeTeam, awayTeam, result };
      }).filter(g => g && g.homeTeam !== '');
    });

    const basePath = path.join(process.cwd(), 'public/data');
    fs.mkdirSync(basePath, { recursive: true });

    fs.writeFileSync(
      path.join(basePath, 'spiele_1Bundesliga.json'),
      JSON.stringify(spiele, null, 2),
      'utf-8'
    );

    console.log(`✅ ${spiele.length} Spiele gespeichert`);

    await browser.close();
  } catch (err) {
    console.error('❌ Fehler:', err);
    process.exit(1);
  }
})();
