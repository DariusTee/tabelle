// scrapeRollhockey.js
import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";

const url = "https://spielplan.rollhockey.de/lm/saison/29/liga/407";

async function scrapeSpieltage() {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const spieltage = [];

    $("div.grid.grid-cols-6.lg\\:grid-cols-12.gap-y-4.items-center.text-center.bg-white.shadow-xl").each((_, el) => {
      const div = $(el);
      const rowData = div.children("div").map((_, child) => $(child).text().trim()).get();

      if (rowData.length >= 5) {
        spieltage.push({
          datum: rowData[0],
          ort: rowData[1],
          heimteam: rowData[2],
          ergebnis: rowData[3],
          auswaertsteam: rowData[4]
        });
      }
    });

    fs.writeFileSync("spieltage.json", JSON.stringify(spieltage, null, 2), "utf-8");
    console.log(`Erfolgreich ${spieltage.length} Spieltage gespeichert.`);
  } catch (error) {
    console.error("Fehler beim Scrapen:", error);
  }
}

scrapeSpieltage();
