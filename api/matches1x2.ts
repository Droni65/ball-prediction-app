// api/matches1x2.ts  (Vercel Edge Function)
// Deploy: metti questo file nella root di un progetto Vercel separato (o nello stesso
// repo Expo se usi Vercel per il monorepo) sotto /api/matches1x2.ts
import * as cheerio from 'cheerio';

export const config = { runtime: 'edge' };

interface Outcome {
  probability: number;
  odd: number | null;
}

interface Match1X2 {
  id: string;
  day: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  home: Outcome;
  draw: Outcome;
  away: Outcome;
  correctScore: { home: number; away: number } | null;
  matchUrl: string | null;
}

function parseOutcome(cellText: string): Outcome | null {
  // formato: "1   31%  2.90"  oppure  "1   37%" (senza quota)
  const m = cellText.match(/(\d+)%\s*([\d.]+)?/);
  if (!m) return null;
  return { probability: Number(m[1]), odd: m[2] ? Number(m[2]) : null };
}

function parseCorrectScore(cellText: string): { home: number; away: number } | null {
  const m = cellText.match(/(\d+)\D+(\d+)/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
}

function extractTeamNames(raw: string) {
  const parts = raw.split(/\s{2,}/).filter(Boolean);
  const uniq = [...new Set(parts.map((p) => p.trim()))];
  return { home: uniq[0] ?? '', away: uniq[1] ?? uniq[0] ?? '' };
}

async function scrape1X2(): Promise<Match1X2[]> {
  const res = await fetch('https://ballprediction.com/1x2', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const matches: Match1X2[] = [];
  let currentDay = '';

  // Ogni tabella del giorno ha nell'intestazione la data (es. "Monday 10 August")
  $('table').each((_, table) => {
    const $table = $(table);
    const dayHeader = $table.find('thead th').first().text().trim();
    if (dayHeader) currentDay = dayHeader;

    $table.find('tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      if (cells.length < 6) return; // salta righe di supporto (possession/shots)

      const league = $(cells[0]).text().trim();
      if (!league) return;

      const matchCell = $(cells[2]);
      const matchUrl = matchCell.find('a').attr('href') ?? null;
      const teams = extractTeamNames(matchCell.text().trim());

      const home = parseOutcome($(cells[3]).text().trim());
      const draw = parseOutcome($(cells[4]).text().trim());
      const away = parseOutcome($(cells[5]).text().trim());
      const cs = parseCorrectScore($(cells[6])?.text().trim() ?? '');

      if (!home || !draw || !away) return;

      matches.push({
        id: matchUrl ?? `${league}-${teams.home}-${teams.away}-${matches.length}`,
        day: currentDay,
        league,
        homeTeam: teams.home,
        awayTeam: teams.away,
        home,
        draw,
        away,
        correctScore: cs,
        matchUrl: matchUrl ? `https://ballprediction.com${matchUrl}` : null,
      });
    });
  });

  return matches;
}

export default async function handler() {
  try {
    const matches = await scrape1X2();
    return new Response(JSON.stringify({ matches, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache edge per 5 minuti (coerente con la frequenza di aggiornamento del sito)
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'scrape_failed' }), { status: 502 });
  }
}
