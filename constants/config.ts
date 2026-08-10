// constants/config.ts
export const SOURCES = [
  { key: '1x2', label: '1X2', url: 'https://ballprediction.com/1x2' },
  { key: 'over', label: 'Over', url: 'https://ballprediction.com/over-prediction' },
  { key: 'btts', label: 'BTTS', url: 'https://ballprediction.com/btts-prediction' },
  { key: 'doubleChance', label: 'Double Chance', url: 'https://ballprediction.com/double-chance' },
] as const;

export type SourceKey = (typeof SOURCES)[number]['key'];