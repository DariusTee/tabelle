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

    await new Promise(resolve => setTimeout(resolve, 5000));

    const spiele = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('lm-schedule-game-entry-row'));

      return rows.map(row => {
        const grid = row.querySelector('div.grid');
        if (!grid) return null;

        const cells = Array.from(grid.children).map(c => c.innerText.trim());

        const date = cells[0] || '';
        const location = cells[1] || '';
        const homeTeam = cells[2] || '';
        const result = cells[3] || '';
        const awayTeam = cells[4] || '';

        return { date, location, homeTeam, awayTeam, result };
      })
      .filter(game => game && game.homeTeam !== '');
    });

    const basePath = path.join(process.cwd(), 'public/data');
    fs.mkdirSync(basePath, { recursive: true });

    fs.writeFileSync(
      path.join(basePath, 'spiele_1Bundesliga.json'),
      JSON.stringify(spiele, null, 2),
      'utf-8'
    );

    console.log(`✅ Spieltage gespeichert: ${spiele.length} Einträge`);
    await browser.close();

  } catch (err) {
    console.error('❌ Fehler beim Laden der Spieltage:', err);
    process.exit(1);
  }
})();
