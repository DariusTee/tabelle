import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const ligas = [
  { name: "1_bundesliga_herren", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/407" },
  { name: "regionalliga_west", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/421" },
  { name: "bundesliga_damen", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/411" },
  { name: "nrw_c_jugend", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/416" },
  { name: "nrw_d_jugend", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/417" },
  { name: "nrw_rookies", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/418" }
];

(async () => {
  try {

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const basePath = path.join(process.cwd(), "public/data");
    fs.mkdirSync(basePath, { recursive: true });

    for (const liga of ligas) {

      const page = await browser.newPage();

      console.log(`Lade Spielplan: ${liga.name}`);

      await page.goto(liga.url, {
        waitUntil: "networkidle2",
        timeout: 120000
      });

      await page.waitForSelector("lm-schedule-game-entry-row", {
        timeout: 60000
      });

      const spiele = await page.evaluate(() => {

        const rows = document.querySelectorAll("lm-schedule-game-entry-row");

        const games = [];

        rows.forEach(row => {

          const grid = row.querySelector(".grid");
          if (!grid) return;

          const cols = Array.from(grid.querySelectorAll(":scope > div"));

          if (cols.length < 5) return;

          const date = cols[0].innerText.trim();
          const location = cols[1].innerText.trim();
          const homeTeam = cols[2].innerText.trim();
          const result = cols[3].innerText.trim();
          const awayTeam = cols[4].innerText.trim();

          if (!homeTeam || !awayTeam) return;

          games.push({
            date,
            location,
            homeTeam,
            awayTeam,
            result
          });

        });

        return games;

      });

      const filePath = path.join(basePath, `${liga.name}_spiele.json`);

      fs.writeFileSync(
        filePath,
        JSON.stringify(spiele, null, 2),
        "utf-8"
      );

      console.log(`✅ ${spiele.length} Spiele gespeichert für ${liga.name}`);

      await page.close();
    }

    await browser.close();

    console.log("✅ Alle Spielpläne erfolgreich aktualisiert");

  } catch (err) {

    console.error("❌ Fehler beim Laden der Spielpläne:", err);
    process.exit(1);

  }
})();
