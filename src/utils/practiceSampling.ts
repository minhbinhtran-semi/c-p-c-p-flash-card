import { VocabularyItem } from '../types';

export function samplePracticeVocabulary(words: VocabularyItem[]): VocabularyItem[] {
  if (!words || words.length === 0) return [];

  // Deduplicate by stable ID (id)
  const seen = new Set<string>();
  const uniqueWords = words.filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  const len = uniqueWords.length;
  let targetSize = len;

  if (len < 10) {
    targetSize = len;
  } else if (len === 10) {
    targetSize = 10;
  } else if (len >= 11 && len <= 19) {
    // Randomly choose between 10 and the deck size (len) inclusive
    targetSize = Math.floor(Math.random() * (len - 10 + 1)) + 10;
  } else {
    // 20 or more words: randomly choose between 10 and 20 words inclusive
    targetSize = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
  }

  // Shuffle unique words and take targetSize
  const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, targetSize);
}
