import fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";

// ⚡ Ligen hier eintragen
const ligas = [
  {
    name: "1. Bundesliga Herren Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=407&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "Bundesliga Damen Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=411&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "Regionalliga West Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=421&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "NRW C-Jugend Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=416&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "NRW D-Jugend Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=417&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "NRW Rookies Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=418&typ=liga&list=all",
    allTeams: false,
  },
  {
    name: "Rookies-Cup Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=449&typ=liga&list=all",
    allTeams: true,
  },
  {
    name: "Regio Final Four Spielplan",
    url: "https://service.liga.rollhockey.de/xml/spielplan.aspx?id=404&typ=liga&list=all",
    allTeams: false,
  },
];

const ligaToTeam = {
  "1. Bundesliga Herren": "1. Herren",
  "1. Bundesliga Damen": "Damen",
  "Regionalliga West": "2. Herren",
  "NRW C-Jugend": "C-Jugend",
  "NRW D-Jugend": "D-Jugend",
  "Rookies Landesmeisterschaft": "Rookies"
};


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

      const spieleArray = Array.isArray(spieleRaw) ? spieleRaw : [spieleRaw];

      const teams = [
        "RHC Recklinghausen",
        "RHC Recklinghausen II",
        "SG Calenberg/Recklinghausen",
      ];

      const spiele = spieleArray
        .map((spiel) => {
          const [day, month, yearAndTime] = spiel.datum.split('.');
          const [year, fullTime] = yearAndTime.split(' ');
          const [hour, minute] = fullTime.split(':');

        return {
          type: "Spiel",
          team: ligaToTeam[spiel.liga] || "Unbekannt",
          date: `${year}-${month}-${day}`,
          time: `${hour}:${minute}`,
          location: spiel.spielort,
          description: spiel.liga,
          home: spiel.heim,
          away: spiel.gast,
          result: spiel.resultat || null,
         };
        })
        .filter(
          (spiel) =>
            liga.allTeams ||
            teams.includes(spiel.home) ||
            teams.includes(spiel.away)
        );

      // 🔥 Optional: nach Datum sortieren
      spiele.sort(
        (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
      );

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
