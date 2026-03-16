import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407/tabelle?displayName=1.%20Bundesliga%20Herren&backlinkIds=407' },
  { name: 'Regionalliga West', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/421/tabelle?displayName=Regionalliga%20West&backlinkIds=421&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'Bundesliga Damen', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/411/tabelle?displayName=1.%20Bundesliga%20Damen&backlinkIds=411&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW C-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/416/tabelle?displayName=NRW%20C-Jugend&backlinkIds=416&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW D-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/417/tabelle?displayName=NRW%20D-Jugend&backlinkIds=417&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW Rookies', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/418/tabelle?displayName=Rookies%20Landesmeisterschaft&backlinkIds=418&playoffLeagueId=NaN&playoutLeagueId=NaN' },
];

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    for (const liga of ligas) {
      const page = await browser.newPage();
      console.log(`Lade Liga: ${liga.name}`);

      await page.goto(liga.url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('lm-schedule-stats-entry-row', { timeout: 60000 });

      // Tabelle extrahieren
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

      // Spieltage extrahieren
      const spiele = await page.$$eval('lm-schedule-entry', (entries) =>
        entries.map((entry) => {
          const date = entry.querySelector('.lm-schedule-entry-date')?.innerText || '';
          const teams = entry.querySelector('.lm-schedule-entry-teams')?.innerText || '';
          const result = entry.querySelector('.lm-schedule-entry-result')?.innerText || '';
          return { date, teams, result };
        })
      );

      // Dateien speichern
      const basePath = path.join(process.cwd(), 'public/data');
      fs.mkdirSync(basePath, { recursive: true });

      const safeName = liga.name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
      fs.writeFileSync(path.join(basePath, `${safeName}_tabelle.json`), JSON.stringify(table, null, 2), 'utf-8');
      fs.writeFileSync(path.join(basePath, `${safeName}_spiele.json`), JSON.stringify(spiele, null, 2), 'utf-8');

      console.log(`✅ Liga ${liga.name} gespeichert: ${table.length} Teams, ${spiele.length} Spiele`);
      await page.close();
    }

    await browser.close();
    console.log('✅ Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('❌ Fehler beim Laden der Ligen:', err);
    process.exit(1);
  }
})();
