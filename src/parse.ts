import * as vscode from "vscode";
import { tokenize } from "jieba-wasm";

export interface Token {
  word: string;
  start: number;
  end: number;
};

function parseSentence(sentence: string): Token[] {
  return tokenize(sentence, "default", true);
}

export function parseAllSelections(): Map<vscode.Selection, Token[]> {
  const editor = vscode.window.activeTextEditor!;
  const document = editor.document;
  const selections = editor.selections;

  const tokensBySelections = new Map<vscode.Selection, Token[]>();
  selections.map((s) => {
    const line = document.lineAt(s.start.line).text;
    tokensBySelections.set(s, parseSentence(line));
  });

  return tokensBySelections;
}
