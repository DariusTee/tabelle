import fs from "fs";
import path from "path";

const ligas = [
  { name: "1_bundesliga_herren", id: 407 }
];

const saison = 29;

async function loadLiga(liga) {

  const url = `https://spielplan.rollhockey.de/api/lm/schedule/${saison}/${liga.id}`;

  console.log("Lade:", url);

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  const text = await res.text();

  if (!text.startsWith("{") && !text.startsWith("[")) {
    throw new Error("API liefert kein JSON:\n" + text.slice(0,200));
  }

  const data = JSON.parse(text);

  const games = data.map(g => ({
    date: g.date,
    location: g.location,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    result: g.result ?? ""
  }));

  const basePath = path.join(process.cwd(), "public/data");
  fs.mkdirSync(basePath, { recursive: true });

  const file = path.join(basePath, `${liga.name}_spiele.json`);

  fs.writeFileSync(file, JSON.stringify(games, null, 2));

  console.log(`Gespeichert: ${games.length} Spiele`);
}

async function run() {

  for (const liga of ligas) {
    await loadLiga(liga);
  }

}

run();
