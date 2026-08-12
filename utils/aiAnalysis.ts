// utils/aiAnalysis.ts

// Su Expo, le variabili d'ambiente che devono essere leggibili dal client
// devono avere il prefisso EXPO_PUBLIC_ e vengono iniettate automaticamente
// in process.env a build-time (nessun plugin babel o config extra necessari).
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  probability?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAIAnalysis = async (matches: MatchData[]): Promise<string> => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('Chiave API Groq mancante o non configurata. Controlla che EXPO_PUBLIC_GROQ_API_KEY sia impostata nel file .env');
  }

  console.log('Dati ricevuti per analisi AI:', JSON.stringify(matches, null, 2));

  // Filtra e valida i dati prima di formattare
  const validMatches = matches.filter(m => {
    const hasOdds = m.odds && m.odds.homeWin !== undefined && m.odds.draw !== undefined && m.odds.awayWin !== undefined;
    const hasProb = m.probability && m.probability.homeWin !== undefined && m.probability.draw !== undefined && m.probability.awayWin !== undefined;
    
    if (!hasOdds || !hasProb) {
      console.warn(`Partita ${m.homeTeam} vs ${m.awayTeam} ha dati incompleti`, { odds: m.odds, prob: m.probability });
      return false;
    }
    return true;
  });

  if (validMatches.length === 0) {
    return "Nessuna partita con dati completi (quote e probabilità) disponibile per l'analisi.";
  }

  // Formatta i dati per l'IA
  const matchesText = validMatches.map(m => 
    `• ${m.homeTeam} vs ${m.awayTeam}\n  Quote: H:${m.odds!.homeWin!.toFixed(2)} | D:${m.odds!.draw!.toFixed(2)} | A:${m.odds!.awayWin!.toFixed(2)}\n  Probabilità: H:${m.probability!.homeWin!}% | D:${m.probability!.draw!}% | A:${m.probability!.awayWin!}%`
  ).join('\n\n');

  const systemPrompt = `Sei un esperto analista di calcio e scommesse sportive con anni di esperienza. Il tuo compito è analizzare le partite fornite basandoti su quote bookmaker e probabilità stimate.
  
  Linee guida per la risposta:
  1. Analizza le discrepanze tra quote e probabilità (value bets).
  2. Evidenzia partite con esiti molto probabili o rischi elevati.
  3. Usa un tono professionale ma accessibile, come un consiglio tra esperti.
  4. RICORDA: Questo è solo un esercizio di analisi statistica. Sottolinea sempre che le scommesse comportano rischi e non esistono certezze.
  5. Rispondi in italiano, strutturando la risposta in punti chiari.
  6. Non inventare dati, usa solo quelli forniti.`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Ecco i dati delle partite da analizzare:\n\n${matchesText}` }
        ],
        max_tokens: 1024,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Errore API Groq (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || 'Nessuna analisi disponibile.';
  } catch (error: any) {
    console.error('Errore durante l\'analisi AI:', error);
    throw error;
  }
};