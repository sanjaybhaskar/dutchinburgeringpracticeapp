/**
 * Tokenizes a Dutch sentence into word/punctuation tokens.
 * Returns an array of tokens where each token is either a word or punctuation.
 */
export interface Token {
  id: string;
  text: string;
  isWord: boolean; // false for punctuation/spaces
}

let tokenCounter = 0;

function makeId(): string {
  return `tok_${++tokenCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Splits a sentence text into word tokens and punctuation tokens.
 * Words are clickable; punctuation is rendered inline but not clickable.
 */
export function tokenizeSentence(sentenceId: string, text: string): Token[] {
  // Split on word boundaries, keeping punctuation attached to words or separate
  // Pattern: match sequences of word characters (including Dutch chars) or punctuation
  const parts = text.match(/[\w\u00C0-\u024F\u1E00-\u1EFF'-]+|[^\w\s\u00C0-\u024F\u1E00-\u1EFF'-]+|\s+/g);

  if (!parts) return [];

  return parts
    .filter((p) => p.trim().length > 0 || p === ' ')
    .map((part) => {
      const isWord = /[\w\u00C0-\u024F\u1E00-\u1EFF'-]/.test(part);
      return {
        id: `${sentenceId}_${makeId()}`,
        text: part,
        isWord,
      };
    });
}

/**
 * Strips punctuation from a word for dictionary lookup.
 */
export function stripPunctuation(word: string): string {
  return word.replace(/^[^\w\u00C0-\u024F\u1E00-\u1EFF]+|[^\w\u00C0-\u024F\u1E00-\u1EFF]+$/g, '');
}
