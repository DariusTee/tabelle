import fetch from 'node-fetch';
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';

const url = 'https://service.liga.rollhockey.de/xml/spielplan.aspx?id=407&typ=liga&list=all';

(async () => {
  const response = await fetch(url);
  const xml = await response.text();

  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xml);

  // result enthält jetzt das gesamte XML als JS-Objekt
  // Hier kannst du die Spiele extrahieren:
  // z.B. result.Spielplan.Spiel oder result.Spielplan.Match

  const filePath = path.join(process.cwd(), 'public/data/1_Bundesliga_Herren.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');

  console.log('✅ XML in JSON gespeichert');
})();
