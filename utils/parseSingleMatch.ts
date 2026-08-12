import { Match1X2 } from "../types/match";

export interface SingleMatchDetails {
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startDate?: string;
  startTime?: string;
  venue?: string;
  probabilities: {
    home: number | null;
    draw: number | null;
    away: number | null;
    under25: number | null;
    over25: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
  };
  correctScore: { home: number; away: number } | null;
  summary: string | null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " "),
  );
}

function extractTitle(html: string, fallback: string): string {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (titleTag) {
    return decodeHtmlEntities(titleTag).replace(/\s+/g, " ").trim();
  }

  const text = stripTags(html);
  const titleMatch = text.match(/([A-Za-z0-9 .&'’()-]+)\s+Prediction/i);
  return titleMatch?.[1]?.trim() || fallback;
}

function extractFirstNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

function extractTeamsFromText(
  text: string,
  fallback?: Partial<Match1X2>,
): {
  homeTeam: string;
  awayTeam: string;
} {
  const titleMatch = text.match(
    /([A-Za-z0-9 .&'’()-]+)\s+vs\.?\s+([A-Za-z0-9 .&'’()-]+)/i,
  );
  if (titleMatch) {
    return { homeTeam: titleMatch[1].trim(), awayTeam: titleMatch[2].trim() };
  }

  const predictionMatch = text.match(/([A-Za-z0-9 .&'’()-]+)\s+Prediction/i);
  if (predictionMatch) {
    const base = predictionMatch[1].trim();
    const parts = base.split(/\s+vs\.?\s+/i);
    if (parts.length === 2) {
      return { homeTeam: parts[0].trim(), awayTeam: parts[1].trim() };
    }
  }

  return {
    homeTeam: fallback?.homeTeam ?? "",
    awayTeam: fallback?.awayTeam ?? "",
  };
}

function extractLeague(text: string, fallback?: Partial<Match1X2>): string {
  const leagueMatch = text.match(/-\s*([A-Za-z0-9 .&'’()-]+)$/i);
  if (leagueMatch) return leagueMatch[1].trim();
  return fallback?.league ?? fallback?.country ?? "";
}

function extractDate(text: string): { date?: string; time?: string } {
  const dateMatch = text.match(
    /(\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b[^\n.]+)/i,
  );
  const timeMatch = text.match(/\b(\d{1,2}:\d{2})\b/);

  return {
    date: dateMatch?.[1]?.trim(),
    time: timeMatch?.[1],
  };
}

export function parseSingleMatchPage(
  html: string,
  fallbackMatch?: Partial<Match1X2>,
): SingleMatchDetails | null {
  const text = stripTags(html);
  
  // DEBUG: Log del testo estratto dopo stripTags
  console.log("=== DEBUG parseSingleMatchPage ===");
  console.log("Testo estratto (primi 500 caratteri):", text.substring(0, 500));
  console.log("=====================================");
  
  const title = extractTitle(html, "");
  
  // DEBUG: Log del titolo estratto
  console.log("=== DEBUG Title ===");
  console.log("Title estratto:", title);
  console.log("===================");
  
  const { homeTeam, awayTeam } = extractTeamsFromText(text, fallbackMatch);
  const league = extractLeague(text, fallbackMatch);
  const { date, time } = extractDate(text);

  const summaryMatch = text.match(/Our prediction gives[^.]*?\.\s*([^\.]+)\./i);
  const summary = summaryMatch?.[1]?.trim() ?? null;

  const sentence = text.match(/Our prediction gives[^.]*\./i)?.[0] ?? text;
  const winMatches = Array.from(
    sentence.matchAll(/(\d+)%[^.]*?chance of .*?winning/gi),
  );
  const homeProbability = winMatches[0]?.[1] ? Number(winMatches[0][1]) : null;
  const awayProbability = winMatches[winMatches.length - 1]?.[1]
    ? Number(winMatches[winMatches.length - 1][1])
    : null;

  const drawProbability = extractFirstNumber(
    sentence,
    /(\d+)%[^.]*chance of a draw/i,
  );
  const under25Probability = extractFirstNumber(
    text,
    /fewer than 2\.5 goals[^.]*?(\d+)%/i,
  );
  const over25Probability = extractFirstNumber(
    text,
    /more than 2\.5 goals[^.]*?(\d+)%/i,
  );
  const bttsYesProbability = extractFirstNumber(
    text,
    /both teams to score[^.]*?(\d+)%/i,
  );
  const bttsNoProbability =
    bttsYesProbability !== null ? 100 - bttsYesProbability : null;

  const scoreMatch = text.match(/predicted to finish\s*(\d+)\s*-\s*(\d+)/i);

  return {
    title: title || `${homeTeam} vs ${awayTeam}`,
    league,
    homeTeam,
    awayTeam,
    startDate: date,
    startTime: time,
    probabilities: {
      home: homeProbability,
      draw: drawProbability,
      away: awayProbability,
      under25: under25Probability,
      over25: over25Probability,
      bttsYes: bttsYesProbability,
      bttsNo: bttsNoProbability,
    },
    correctScore: scoreMatch
      ? { home: Number(scoreMatch[1]), away: Number(scoreMatch[2]) }
      : null,
    summary,
  };
}
