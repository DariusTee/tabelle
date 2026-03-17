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

    // Kurze Wartezeit, um dynamische Inhalte zu laden
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Spieltage aus Shadow DOM extrahieren
    const spiele = await page.evaluate(() => {
      const entries = Array.from(document.querySelectorAll('lm-schedule-entry'));
      return entries.map(entry => {
        const shadow = entry.shadowRoot;
        const date = shadow?.querySelector('.lm-schedule-entry-date')?.innerText || '';
        const teamsText = shadow?.querySelector('.lm-schedule-entry-teams')?.innerText || '';
        const result = shadow?.querySelector('.lm-schedule-entry-result')?.innerText || '';
        const location = shadow?.querySelector('.lm-schedule-entry-location')?.innerText || '';

        const [homeTeam = '', awayTeam = ''] = teamsText.split(' - ').map(t => t.trim());

        return { date, location, homeTeam, awayTeam, result };
      });
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
