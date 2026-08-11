// constants/config.ts
export const SOURCES = [
  { key: '1x2', label: '1X2', url: 'https://ballprediction.com/1x2' },
  { key: 'over', label: 'Under Over', url: 'https://ballprediction.com/over-prediction' },
  { key: 'btts', label: 'Gol NoGol', url: 'https://ballprediction.com/btts-prediction' },
  { key: 'doubleChance', label: 'Doppia Chance', url: 'https://ballprediction.com/double-chance' },
] as const;

export type SourceKey = (typeof SOURCES)[number]['key'];