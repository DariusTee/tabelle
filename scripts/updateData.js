import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407/tabelle?displayName=1.%20Bundesliga%20Herren&backlinkIds=407' },
  // weitere Ligen...
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
        console.log(`Lade Tabelle: ${liga.name}`);

        await page.goto(liga.url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('lm-schedule-stats-entry-row', { timeout: 60000 });

        const table = await page.$$eval('lm-schedule-stats-entry-row', (rows) =>
          rows.map((row) => {
            const text = row.innerText.trim();
            const punkteMatch = text.match(/(\d+)\s*$/);
            const punkte = punkteMatch ? punkteMatch[1] : '';
            const toreMatch = text.match(/(\d+)\s*:\s*(\d+)/);
            const tore = toreMatch ? `${toreMatch[1]} : ${toreMatch[2]}` : '';
            let cleaned = text.replace(/\d+\s*$/, '').replace(/(\d+\s*:\s*\d+)/, '').trim();
            const parts = cleaned.split(/\s+/);
            const platz = parts.shift();
            const niederlagen = parts.pop();
            const unentschieden = parts.pop();
            const siege = parts.pop();
            const spiele = parts.pop();
            const team = parts.join(' ');
            return { platz, team, spiele, siege, unentschieden, niederlagen, tore, punkte };
          })
        );

        const fileName = liga.name.replace(/\s+/g, '_') + '.json';
        const dataPath = path.join(process.cwd(), 'public/data', fileName);
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(table, null, 2), 'utf-8');

        console.log(`Tabelle gespeichert: ${fileName} (${table.length} Teams)`);

        await page.close();
      })
    );

    await browser.close();
    console.log('✅ Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Tabellen:', err);
    process.exit(1);
  }
})(); // ← hier endet der IIFE Block korrekt
