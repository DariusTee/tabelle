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
      console.log(`Lade Spielplan: ${liga.name}`);

      await page.goto(liga.url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

      const games = await page.$$eval('lm-schedule-game-entry-row', rows =>
        rows.map(row => {
          // Alle Texte aus divs sammeln und leere Strings entfernen
          const texts = Array.from(row.querySelectorAll('div'))
            .map(div => div.innerText.trim())
            .filter(text => text.length > 0);

          return {
            date: texts[0] || '',
            location: texts[1] || '',
            homeTeam: texts[2] || '',
            result: texts[3] || '',
            awayTeam: texts[4] || '',
          };
        })
      );

      const fileName = liga.name.replace(/\s+/g, '_') + '_games.json';
      const dataPath = path.join(process.cwd(), 'public/data', fileName);
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

      console.log(`Spielplan gespeichert: ${fileName} (${games.length} Spiele)`);
      await page.close();
    }

    await browser.close();
    console.log('✅ Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Spielpläne:', err);
    process.exit(1);
  }
})();
