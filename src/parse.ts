import { tokenize } from "jieba-wasm";

export interface Token {
  word: string;
  start: number;
  end: number;
};

export function parseSentence(sentence: string): Token[] {
  return tokenize(sentence, "default", true);
}