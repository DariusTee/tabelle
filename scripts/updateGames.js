import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligaUrl = 'https://spielplan.rollhockey.de/lm/saison/29/liga/407'; // 1. Bundesliga Herren

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    console.log(`Lade Spielplan von ${ligaUrl} ...`);
    await page.goto(ligaUrl, { waitUntil: 'networkidle2' });

    // Warte, bis die Spieltage geladen sind
    await page.waitForSelector('lm-schedule-entry', { timeout: 60000 });

    // Extrahiere die Spieltage
    const spiele = await page.$$eval('lm-schedule-entry', (entries) =>
      entries.map((entry) => {
        const date = entry.querySelector('.lm-schedule-entry-date')?.innerText.trim() || '';
        const teamsText = entry.querySelector('.lm-schedule-entry-teams')?.innerText.trim() || '';
        const result = entry.querySelector('.lm-schedule-entry-result')?.innerText.trim() || '';
        const location = entry.querySelector('.lm-schedule-entry-location')?.innerText.trim() || '';

        // Teile Teams in Heim und Auswärts
        let heimteam = '';
        let auswaertsteam = '';
        if (teamsText.includes('–')) { // langer Bindestrich
          [heimteam, auswaertsteam] = teamsText.split('–').map(t => t.trim());
        } else if (teamsText.includes('-')) { // normaler Bindestrich
          [heimteam, auswaertsteam] = teamsText.split('-').map(t => t.trim());
        }

        return { date, location, heimteam, auswaertsteam, result };
      })
    );

    // Speichere das JSON
    const basePath = path.join(process.cwd(), 'public/data');
    fs.mkdirSync(basePath, { recursive: true });
    const filePath = path.join(basePath, '1_Bundesliga_Herren_spieltage.json');
    fs.writeFileSync(filePath, JSON.stringify(spiele, null, 2), 'utf-8');

    console.log(`✅ Spieltage gespeichert: ${spiele.length} Einträge`);
    await browser.close();
  } catch (err) {
    console.error('❌ Fehler beim Laden der Spieltage:', err);
    process.exit(1);
  }
})();
