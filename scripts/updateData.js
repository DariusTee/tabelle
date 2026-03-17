import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { 
    name: '1. Bundesliga Herren', 
    tabelleUrl: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407/tabelle?displayName=1.%20Bundesliga%20Herren&backlinkIds=407&playoffLeagueId=NaN&playoutLeagueId=NaN',
    spieleUrl: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407'
  },
  // andere Ligen hier ähnlich ergänzen
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    for (const liga of ligas) {
      const page = await browser.newPage();

      // ==== Tabelle ====
      await page.goto(liga.tabelleUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('lm-schedule-stats-entry-row', { timeout: 60000 });

      const table = await page.evaluate(() => {
        const rows = [];
        document.querySelectorAll('lm-schedule-stats-entry-row').forEach(rowEl => {
          const shadow = rowEl.shadowRoot;
          if (!shadow) return;
          const text = shadow.innerText.trim();
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
          rows.push({ platz, team, spiele, siege, unentschieden, niederlagen, tore, punkte });
        });
        return rows;
      });

      // ==== Spieltage ====
      await page.goto(liga.spieleUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('lm-schedule-entry', { timeout: 60000 });

      const spiele = await page.evaluate(() => {
        const entries = [];
        document.querySelectorAll('lm-schedule-entry').forEach(el => {
          const shadow = el.shadowRoot;
          if (!shadow) return;
          const date = shadow.querySelector('.lm-schedule-entry-date')?.innerText || '';
          const teams = shadow.querySelector('.lm-schedule-entry-teams')?.innerText || '';
          const result = shadow.querySelector('.lm-schedule-entry-result')?.innerText || '';
          entries.push({ date, teams, result });
        });
        return entries;
      });

      // ==== Dateien speichern ====
      const basePath = path.join(process.cwd(), 'public/data');
      fs.mkdirSync(basePath, { recursive: true });

      const safeName = liga.name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
      fs.writeFileSync(path.join(basePath, `${safeName}_tabelle.json`), JSON.stringify(table, null, 2), 'utf-8');
      fs.writeFileSync(path.join(basePath, `${safeName}_spiele.json`), JSON.stringify(spiele, null, 2), 'utf-8');

      console.log(`✅ Liga ${liga.name} gespeichert: ${table.length} Teams, ${spiele.length} Spiele`);
      await page.close();
    }
  } catch (err) {
    console.error('❌ Fehler beim Laden der Ligen:', err);
  } finally {
    await browser.close();
  }
})();
