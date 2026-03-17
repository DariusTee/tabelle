import fs from "fs";
import path from "path";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function run() {

  console.log("Lade:", url);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await res.text();

  const regex = /id="table-row-\d+"[\s\S]*?<div class="col-span-2">\s*([^<]+)\s*<\/div>[\s\S]*?<div class="col-span-2[^>]*>\s*([^<]*)\s*<\/div>[\s\S]*?<div class="col-span-2">\s*([^<]+)\s*<\/div>[\s\S]*?<div>\s*([^<]*)\s*<\/div>[\s\S]*?<div class="col-span-2[^>]*>\s*([^<]+)\s*<\/div>/g;

  const games = [];

  let match;

  while ((match = regex.exec(html)) !== null) {

    games.push({
      date: match[1].trim(),
      location: match[2].trim(),
      homeTeam: match[3].trim(),
      result: match[4].trim(),
      awayTeam: match[5].trim()
    });

  }

  const basePath = path.join(process.cwd(), "public/data");
  fs.mkdirSync(basePath, { recursive: true });

  const file = path.join(basePath, "1_bundesliga_spiele.json");

  fs.writeFileSync(file, JSON.stringify(games, null, 2));

  console.log("Gespeichert:", games.length, "Spiele");
}

run();
