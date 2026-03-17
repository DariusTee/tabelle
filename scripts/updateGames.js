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
