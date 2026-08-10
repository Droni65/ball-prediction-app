// utils/parseMatches.ts
import { SourceKey } from '../constants/config';
import { Match1X2, Outcome1X2 } from '../types/match';

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCells(rowHtml: string): string[] {
  return (rowHtml.match(/<td\b[\s\S]*?<\/td>/gi) ?? []).map(stripTags);
}

function extractHref(rowHtml: string): string | null {
  const match = rowHtml.match(/<a[^>]+href=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function parseOutcome(text: string): Outcome1X2 | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const probabilityMatch = normalized.match(/(\d{1,3})\s*%/);
  if (!probabilityMatch) return null;

  const probability = Number(probabilityMatch[1]);
  const afterPercentage = normalized.slice(
    (probabilityMatch.index ?? 0) + probabilityMatch[0].length,
  );
  const oddMatch = afterPercentage.match(/(\d+(?:\.\d+)?)/);

  return {
    probability,
    odd: oddMatch ? Number(oddMatch[1]) : null,
  };
}

function parseCorrectScore(text: string): { home: number; away: number } | null {
  const normalized = text.replace(/\s+/g, ' ').trim();

  const separated = normalized.match(/\b(\d+)\s*[-:]\s*(\d+)\b/);
  if (separated) {
    return {
      home: Number(separated[1]),
      away: Number(separated[2]),
    };
  }

  // Il sito può restituire il CS come due numeri separati, ad esempio "0 1".
  const numbers = normalized.match(/\b\d+\b/g);
  if (!numbers || numbers.length < 2) return null;

  return {
    home: Number(numbers[0]),
    away: Number(numbers[1]),
  };
}

function extractTeamNames(text: string): { home: string; away: string } | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;

  for (let homeSize = 1; homeSize <= Math.floor(words.length / 2); homeSize += 1) {
    const home = words.slice(0, homeSize).join(' ');
    const repeatedHome = words.slice(homeSize, homeSize * 2).join(' ');
    if (home !== repeatedHome) continue;

    const rest = words.slice(homeSize * 2);
    for (let awaySize = 1; awaySize <= Math.floor(rest.length / 2); awaySize += 1) {
      const away = rest.slice(0, awaySize).join(' ');
      const repeatedAway = rest.slice(awaySize, awaySize * 2).join(' ');
      if (away === repeatedAway) return { home, away };
    }
  }

  const parts = text
    .split(/\s{2,}|\s[-–]\s|\svs\.?\s/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return { home: parts[0], away: parts[1] };
  }

  const middle = Math.ceil(words.length / 2);
  return {
    home: words.slice(0, middle).join(' '),
    away: words.slice(middle).join(' '),
  };
}

function extractDayHeaders(html: string): { index: number; label: string }[] {
  const headers: { index: number; label: string }[] = [];
  const regex = /<(?:th|td|h[1-6]|strong|b)[^>]*>[\s\S]*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+[A-Za-z]+[\s\S]*?<\/(?:th|td|h[1-6]|strong|b)>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    headers.push({ index: match.index, label: stripTags(match[0]) });
  }

  return headers;
}

function extractCountryAndTime(text: string): { country: string; startTime: string } {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const timeMatch = normalized.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  const startTime = timeMatch?.[0] ?? '';
  const country = normalized.replace(startTime, '').trim();
  return { country, startTime };
}

function makeUniqueId(source: SourceKey, index: number, day: string, teams: { home: string; away: string }): string {
  return `${source}-${index}-${day}-${teams.home}-${teams.away}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseMatches(html: string, source: SourceKey = '1x2'): Match1X2[] {
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
  const dayHeaders = extractDayHeaders(html);
  const matches: Match1X2[] = [];
  let cursor = 0;

  for (const rowHtml of rows) {
    const rowIndex = html.indexOf(rowHtml, cursor);
    cursor = rowIndex + rowHtml.length;

    const cells = extractCells(rowHtml);
    if (cells.length < 5) continue;

    const currentDay = dayHeaders
      .filter((header) => header.index <= rowIndex)
      .at(-1)?.label ?? '';

    const countryAndTime = extractCountryAndTime(cells[0] ?? '');
    const league = countryAndTime.country || cells[0] || '';
    const teams = extractTeamNames(cells[2] ?? '');
    if (!teams) continue;

    const first = parseOutcome(cells[3] ?? '');
    const second = parseOutcome(cells[4] ?? '');
    const third = parseOutcome(cells[5] ?? '');
    if (!first || !second) continue;

    const scoreCell = cells.length >= 7 ? cells[6] : cells[5];
    const matchUrl = extractHref(rowHtml);

    matches.push({
      id: makeUniqueId(source, matches.length, currentDay, teams),
      day: currentDay,
      league,
      country: league,
      startTime: countryAndTime.startTime,
      homeTeam: teams.home,
      awayTeam: teams.away,
      home: first,
      draw: second,
      away: third ?? second,
      correctScore: parseCorrectScore(scoreCell ?? ''),
      matchUrl: matchUrl
        ? matchUrl.startsWith('http')
          ? matchUrl
          : `https://ballprediction.com${matchUrl}`
        : null,
    });
  }

  return matches;
}
