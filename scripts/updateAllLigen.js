import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// ⚡ Hier alle Ligen eintragen
const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/407/tabelle?displayName=1.%20Bundesliga%20Herren&backlinkIds=407' },
  { name: 'Regionalliga West', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/421/tabelle?displayName=Regionalliga%20West&backlinkIds=421&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'Bundesliga Damen', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/411/tabelle?displayName=1.%20Bundesliga%20Damen&backlinkIds=411&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW C-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/416/tabelle?displayName=NRW%20C-Jugend&backlinkIds=416&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW D-Jugend', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/417/tabelle?displayName=NRW%20D-Jugend&backlinkIds=417&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  { name: 'NRW Rookies', url: 'https://spielplan.rollhockey.de/lm/saison/29/liga/418/tabelle?displayName=Rookies%20Landesmeisterschaft&backlinkIds=418&playoffLeagueId=NaN&playoutLeagueId=NaN' },
  // weitere Ligen hier hinzufügen
];

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    for (const liga of ligas) {
      console.log(`Lade Tabelle: ${liga.name}`);
      await page.goto(liga.url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 3000)); // warten, bis JS die Tabelle rendert
      await page.waitForSelector('lm-schedule-stats-entry-row', { timeout: 60000 });

      const table = await page.$$eval('lm-schedule-stats-entry-row', rows =>
        rows.map(row => {
          const text = row.innerText.trim();

          // letzte Zahl = Punkte
          const punkteMatch = text.match(/(\d+)\s*$/);
          const punkte = punkteMatch ? punkteMatch[1] : '';

          // Torverhältnis: "Zahl : Zahl"
          const toreMatch = text.match(/(\d+)\s*:\s*(\d+)/);
          const tore = toreMatch ? `${toreMatch[1]} : ${toreMatch[2]}` : '';

          // Text ohne Tore und Punkte
          let cleaned = text.replace(/\d+\s*$/, '').replace(/(\d+\s*:\s*\d+)/, '').trim();

          // Rest splitten
          const parts = cleaned.split(/\s+/);
          const platz = parts.shift(); // erste Zahl = Platz
          const niederlagen = parts.pop();
          const unentschieden = parts.pop();
          const siege = parts.pop();
          const spiele = parts.pop();
          const team = parts.join(' ');

          return { platz, team, spiele, siege, unentschieden, niederlagen, tore, punkte };
        })
      );

      // JSON-Datei für die Liga speichern
      const fileName = liga.name.replace(/\s+/g, '_') + '.json';
      const dataPath = path.join(process.cwd(), 'public/data', fileName);
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(table, null, 2), 'utf-8');

      console.log(`Tabelle gespeichert: ${fileName} (${table.length} Teams)`);
    }

    await browser.close();
    console.log('Alle Ligen erfolgreich aktualisiert!');
  } catch (err) {
    console.error('Fehler beim Laden der Tabellen:', err);
  }
})();