export const modernSentimentLexicon = {
  positive: ["????", "???", "?????", "??????", "?????????", "???????", "????????", "\u0e08\u0e36\u0e49\u0e07", "\u0e1b\u0e31\u0e07", "\u0e40\u0e23\u0e34\u0e48\u0e14", "\u0e2a\u0e27\u0e22", "\u0e19\u0e48\u0e32\u0e23\u0e31\u0e01", "\u0e25\u0e30\u0e21\u0e38\u0e19", "\u0e0a\u0e2d\u0e1a", "\u0e2d\u0e22\u0e32\u0e01\u0e44\u0e14\u0e49", "\u0e15\u0e49\u0e2d\u0e07\u0e21\u0e35", "\u0e1b\u0e49\u0e32\u0e22\u0e22\u0e32", "\u0e27\u0e49\u0e32\u0e27", "\u0e43\u0e0a\u0e49\u0e14\u0e35", "\u0e15\u0e34\u0e14\u0e17\u0e19"],
  neutral: ["\u0e40\u0e09\u0e22\u0e46", "\u0e01\u0e47\u0e44\u0e14\u0e49\u0e2d\u0e22\u0e39\u0e48", "\u0e1c\u0e48\u0e32\u0e19", "\u0e19\u0e48\u0e32\u0e25\u0e2d\u0e07", "\u0e23\u0e32\u0e04\u0e32\u0e40\u0e17\u0e48\u0e32\u0e44\u0e2b\u0e23\u0e48", "\u0e0b\u0e37\u0e49\u0e2d\u0e17\u0e35\u0e48\u0e44\u0e2b\u0e19", "\u0e2a\u0e35\u0e2d\u0e30\u0e44\u0e23", "\u0e21\u0e35\u0e02\u0e32\u0e22\u0e44\u0e2b\u0e21", "\u0e1e\u0e34\u0e01\u0e31\u0e14"],
  negative: ["\u0e1a\u0e49\u0e07", "\u0e15\u0e38\u0e49\u0e1a", "\u0e44\u0e21\u0e48\u0e44\u0e2b\u0e27", "\u0e1e\u0e31\u0e07", "\u0e08\u0e01\u0e15\u0e32", "\u0e42\u0e1b\u0e4a\u0e30", "\u0e40\u0e1f\u0e25", "\u0e41\u0e1e\u0e07\u0e44\u0e1b", "\u0e02\u0e2d\u0e07\u0e2b\u0e21\u0e14", "\u0e44\u0e21\u0e48\u0e23\u0e2d\u0e14", "\u0e44\u0e21\u0e48\u0e0a\u0e2d\u0e1a", "\u0e1c\u0e34\u0e14\u0e2b\u0e27\u0e31\u0e07", "\u0e2b\u0e48\u0e27\u0e22", "\u0e41\u0e22\u0e48", "\u0e1b\u0e25\u0e2d\u0e21", "\u0e2a\u0e48\u0e07\u0e0a\u0e49\u0e32", "\u0e41\u0e15\u0e01", "\u0e23\u0e31\u0e48\u0e27", "\u0e23\u0e30\u0e04\u0e32\u0e22\u0e40\u0e04\u0e37\u0e2d\u0e07"],
};

export const modernSentimentContextRules = [
  { term: "\u0e44\u0e21\u0e48\u0e44\u0e2b\u0e27", positiveWhen: ["\u0e23\u0e2d", "\u0e2d\u0e14\u0e43\u0e08"], negativeWhen: ["\u0e43\u0e0a\u0e49", "\u0e41\u0e1e\u0e49", "\u0e41\u0e2a\u0e1a", "\u0e23\u0e30\u0e04\u0e32\u0e22"] },
  { term: "\u0e41\u0e23\u0e07", positiveWhen: ["\u0e2a\u0e35", "\u0e40\u0e21\u0e47\u0e14\u0e2a\u0e35", "\u0e0a\u0e31\u0e14", "\u0e2a\u0e27\u0e22", "\u0e08\u0e36\u0e49\u0e07", "\u0e1b\u0e31\u0e07"], negativeWhen: ["\u0e23\u0e32\u0e04\u0e32", "\u0e41\u0e1e\u0e07", "\u0e01\u0e25\u0e34\u0e48\u0e19", "\u0e23\u0e30\u0e04\u0e32\u0e22", "\u0e41\u0e2a\u0e1a"] },
  { term: "\u0e15\u0e32\u0e22", positiveWhen: ["\u0e2a\u0e27\u0e22", "\u0e19\u0e48\u0e32\u0e23\u0e31\u0e01", "\u0e08\u0e36\u0e49\u0e07", "\u0e1b\u0e31\u0e07", "\u0e0a\u0e2d\u0e1a"], negativeWhen: ["\u0e1e\u0e31\u0e07", "\u0e41\u0e1e\u0e49", "\u0e23\u0e30\u0e04\u0e32\u0e22", "\u0e41\u0e2a\u0e1a"] },
  { term: "\u0e09\u0e48\u0e33", positiveWhen: ["\u0e1c\u0e34\u0e27", "\u0e1b\u0e32\u0e01", "\u0e2a\u0e35", "\u0e2a\u0e27\u0e22", "\u0e27\u0e32\u0e27"], negativeWhen: ["\u0e40\u0e2b\u0e19\u0e35\u0e22\u0e27", "\u0e40\u0e22\u0e34\u0e49\u0e21"] },
];

export function classifyModernSentiment(text) {
  const value = String(text || '').toLowerCase();
  for (const rule of modernSentimentContextRules) {
    if (!value.includes(rule.term)) continue;
    if (rule.negativeWhen.some((word) => value.includes(word))) return 'negative';
    if (rule.positiveWhen.some((word) => value.includes(word))) return 'positive';
  }
  const positiveHits = countHits(value, modernSentimentLexicon.positive);
  const negativeHits = countHits(value, modernSentimentLexicon.negative);
  const neutralHits = countHits(value, modernSentimentLexicon.neutral);
  if (negativeHits > 0 && negativeHits >= positiveHits) return 'negative';
  if (positiveHits > 0 && positiveHits > negativeHits) return 'positive';
  if (neutralHits > 0) return 'neutral';
  return null;
}

function countHits(text, terms) {
  return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}
