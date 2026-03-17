import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// ⚡ Hier alle Ligen eintragen
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

    for (const liga of ligas) {
      const page = await browser.newPage();
      console.log(`Lade Spiele: ${liga.name}`);
      await page.goto(liga.url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

      const games = await page.$$eval('lm-schedule-game-entry-row', rows =>
        rows.map(row => {
          const divs = Array.from(row.querySelectorAll('div'));

          // Nur direkten Textknoten auslesen (kein HTML)
          const getDirectText = div => Array.from(div.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .join(' ')
            .trim();

          return {
            date: getDirectText(divs[0]) || '',
            location: getDirectText(divs[1]) || '',
            homeTeam: getDirectText(divs[2]) || '',
            result: getDirectText(divs[3]) || '',
            awayTeam: getDirectText(divs[4]) || '',
          };
        })
      );

      const fileName = liga.name.replace(/\s+/g, '_') + '.json';
      const dataPath = path.join(process.cwd(), 'public/data', fileName);
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

      console.log(`Gespeichert: ${fileName} (${games.length} Spiele)`);
      await page.close();
    }

    await browser.close();
    console.log('✅ Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Spiele:', err);
    process.exit(1);
  }
})();
