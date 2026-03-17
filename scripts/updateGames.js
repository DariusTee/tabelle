import fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";

// ⚡ Ligen hier eintragen
const ligas = [
  {
    name: "1. Bundesliga Herren Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=407&typ=liga&list=all",
  },
];

(async () => {
  for (const liga of ligas) {
    try {
      console.log(`Lade XML für: ${liga.name}`);

      const response = await fetch(liga.url);
      const xml = await response.text();

      const result = await parseStringPromise(xml, {
        explicitArray: false,
        trim: true,
      });

      const spieleRaw = result?.ihs?.Spiel;

      if (!spieleRaw) {
        console.log(`❌ Keine Spiele gefunden für ${liga.name}`);
        continue;
      }

      const spieleArray = Array.isArray(spieleRaw)
        ? spieleRaw
        : [spieleRaw];

      const teams = [
        "RHC Recklinghausen",
        "RHC Recklinghausen II",
        "SG Calenberg/Recklinghausen",
      ];

      const spiele = spieleArray
        .map((spiel) => {
          // Datum in amerikanisches Format
          const [day, month, yearAndTime] = spiel.datum.split('.');
          const [year, time] = yearAndTime.split(' ');

          const dateObj = new Date(`${year}-${month}-${day}T${time}`);

          return {
            type: "Spiel",
            date: `${year}-${month}-${day}`, // YYYY-MM-DD
            time: time, // HH:MM:SS
            location: spiel.spielort,
            description: spiel.liga,
            home: spiel.heim,
            away: spiel.gast,
            result: spiel.resultat || null,
          };
        })
        .filter(
          (spiel) =>
            teams.includes(spiel.home) || teams.includes(spiel.away)
        );

      // 🔥 Optional: nach Datum sortieren
      spiele.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

      const fileName = liga.name.replace(/\s+/g, "_") + ".json";
      const filePath = path.join(process.cwd(), "public/data", fileName);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(spiele, null, 2), "utf-8");

      console.log(`✅ ${liga.name}: ${spiele.length} Spiele gespeichert`);
    } catch (err) {
      console.error(`❌ Fehler bei ${liga.name}:`, err);
    }
  }

  console.log("🎉 Alle Ligen verarbeitet!");
})();
