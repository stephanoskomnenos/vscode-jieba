import QuickLRU from 'quick-lru';

const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

export interface Token {
  word: string;
  start: number;
  end: number;
}

const tokenize = (text: string) => {
  return Array.from(segmenter.segment(text), ({ segment, index }) => {
    return { word: segment, start: index, end: index + segment.length }
  })
}

const cache = new QuickLRU<String, Token[]>({ maxSize: 25 });

export function parseSentence(sentence: string): Token[] {
  if (cache.has(sentence)) {
    return cache.get(sentence)!;
  }
  const tokens = tokenize(sentence);
  cache.set(sentence, tokens);
  return tokens;
}