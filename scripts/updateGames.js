import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const ligas = [
  { name: "1_bundesliga_herren", url: "https://spielplan.rollhockey.de/lm/saison/29/liga/407" }
];

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const basePath = path.join(process.cwd(), "public/data");
  fs.mkdirSync(basePath, { recursive: true });

  for (const liga of ligas) {

    const page = await browser.newPage();

    console.log("Lade:", liga.url);

    await page.goto(liga.url, {
      waitUntil: "networkidle2",
      timeout: 120000
    });

    // warten bis erste Spiele sichtbar sind
    await page.waitForSelector("lm-schedule-game-entry-row");

    // mehrfach scrollen damit Angular weitere Spiele lädt
    let previousCount = 0;

    while (true) {

      const currentCount = await page.evaluate(() =>
        document.querySelectorAll("lm-schedule-game-entry-row").length
      );

      if (currentCount === previousCount) break;

      previousCount = currentCount;

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    const spiele = await page.evaluate(() => {

      const rows = document.querySelectorAll("lm-schedule-game-entry-row");
      const games = [];

      rows.forEach(row => {

        const grid = row.querySelector(".grid");
        if (!grid) return;

        const cols = grid.querySelectorAll(":scope > div");
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

    console.log(`Gespeichert: ${spiele.length} Spiele`);

    await page.close();
  }

  await browser.close();

})();
