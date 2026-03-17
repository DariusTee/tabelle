import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';

// ⚡ Hier alle Ligen eintragen
const ligas = [
  { name: '1. Bundesliga Herren', url: 'https://service.liga.rollhockey.de/xml/spielplan.aspx?id=407&typ=liga&list=all' },
  { name: 'Bundesliga Damen', url: 'https://service.liga.rollhockey.de/xml/spielplan.aspx?id=411&typ=liga&list=all' },
  // weitere Ligen hier hinzufügen
];

(async () => {
  const parser = new xml2js.Parser({ explicitArray: false });

  for (const liga of ligas) {
    try {
      console.log(`Lade XML für: ${liga.name}`);
      const response = await fetch(liga.url);
      const xml = await response.text();

      const result = await parser.parseStringPromise(xml);

      // XML-Spiele extrahieren – je nach Struktur
      // Annahme: result.Spielplan.Spiel enthält alle Spiele
      const spiele = (result.Spielplan?.Spiel || []).map(spiel => ({
        id: spiel.$?.ID || null,
        datum: spiel.Datum,
        ort: spiel.Ort,
        heimteam: spiel.Heim,
        ergebnis: spiel.Ergebnis,
        auswaertsteam: spiel.Gast,
      }));

      const fileName = liga.name.replace(/\s+/g, '_') + '_spielplan.json';
      const dataPath = path.join(process.cwd(), 'public/data', fileName);
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(spiele, null, 2), 'utf-8');

      console.log(`✅ ${liga.name} gespeichert (${spiele.length} Spiele)`);
    } catch (err) {
      console.error(`❌ Fehler beim Laden von ${liga.name}:`, err);
    }
  }
})();
