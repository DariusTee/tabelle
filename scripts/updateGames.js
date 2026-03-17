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

    // Hilfsfunktion: nur direkte Textknoten eines divs auslesen
    function getDirectText(div) {
      if (!div) return '';
      return Array.from(div.childNodes)
        .filter(node => node.nodeType === 3) // nur Textknoten
        .map(node => node.textContent.trim())
        .join(' ')
        .replace(/\s+/g, ' ');
    }

    await Promise.all(
      ligas.map(async (liga) => {
        const page = await browser.newPage();
        console.log(`Lade Spiele: ${liga.name}`);

        await page.goto(liga.url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('lm-schedule-game-entry-row', { timeout: 60000 });

const games = await page.$$eval('lm-schedule-game-entry-row', (rows) =>
  rows.map((row) => {
    // Alle divs der Zeile
    const divs = Array.from(row.querySelectorAll('div'));

    // Nur sichtbare Texte extrahieren und Icons/Buttons ignorieren
    const texts = divs
      .map(d => d.innerText.trim())
      .filter(t => t && !['check_circle', 'circle', 'open_in_new'].includes(t));

    return {
      date: texts[0] || '',
      location: texts[1] || '',
      homeTeam: texts[2] || '',
      result: texts[3] || '',
      awayTeam: texts[4] || '',
    };
  })
);

        const fileName = liga.name.replace(/\s+/g, '_') + '.json';
        const dataPath = path.join(process.cwd(), 'public/data', fileName);
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf-8');

        console.log(`Spiele gespeichert: ${fileName} (${games.length} Spiele)`);

        await page.close();
      })
    );

    await browser.close();
    console.log('✅ Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Spiele:', err);
    process.exit(1);
  }
})();
