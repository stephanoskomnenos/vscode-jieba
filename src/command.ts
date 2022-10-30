import * as vscode from "vscode";
import { parseAllSelections } from "./parse";

export function forwardWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const { newSelections: newSelections } = searchForward();
  editor.selections = newSelections;
}

export function backwardWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const { newSelections: newSelections } = searchBackward();
  editor.selections = newSelections;
}

export function killWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }

  const { newSelections, rangesToDelete } = searchForward();

  editor.selections = newSelections;
  editor.edit((edit) => {
    for (let range of rangesToDelete) {
      edit.delete(range);
    }
  });
}

export function backwardKillWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }

  const { newSelections, rangesToDelete } = searchBackward();

  editor.selections = newSelections;
  editor.edit((edit) => {
    for (let range of rangesToDelete) {
      edit.delete(range);
    }
  });
}

export function selectWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }

  const tokensBySelections = parseAllSelections();

  let newSelections: vscode.Selection[] = [];

  for (let [selection, tokens] of tokensBySelections) {
    const start = selection.start;
    const lineNum = start.line;
    const charNum = start.character;

    for (let token of tokens) {
      if (token.start <= charNum && token.end > charNum) {
        const wordStart = new vscode.Position(lineNum, token.start);
        const wordEnd = new vscode.Position(lineNum, token.end);
        newSelections.push(new vscode.Selection(wordStart, wordEnd));
        break;
      }
    }
  }

  editor.selections = newSelections;
}

function searchForward(): {
  newSelections: vscode.Selection[];
  rangesToDelete: vscode.Range[];
} {
  const document = vscode.window.activeTextEditor!.document;
  const tokensBySelections = parseAllSelections();

  let newSelections: vscode.Selection[] = [];
  let rangesToDelete: vscode.Range[] = [];

  for (let [selection, tokens] of tokensBySelections) {
    let cursor = selection.start;
    const line = document.lineAt(cursor.line);

    /*
     * if the cursor is not at the end of the line
     * and the character after is whitespace,
     * then mark range(cursor, next non-whitespace) for deletion
     * and move the cursor to the next non-whitespace character,
     * then continue the process of moving forward.
     */
    if (
      cursor.character !== line.range.end.character &&
      isWhiteSpace(line.text[cursor.character])
    ) {
      const nonSpacePos = findFirstNonSpace(line.text.slice(cursor.character));
      const nextPos = nonSpacePos === -1
        ? line.range.end.character
        : cursor.character + nonSpacePos;
      const nextNonSpace = new vscode.Position(cursor.line, nextPos);
      rangesToDelete.push(new vscode.Range(cursor, nextNonSpace));
      cursor = nextNonSpace;
    }

    /*
     * if the cursor is at the end of the line
     * and the next line exists,
     * then jump to the beginning of the next line.
     */
    if (
      cursor.isEqual(line.range.end) &&
      document.lineCount > cursor.line + 1
    ) {
      const nextLineStart = new vscode.Position(cursor.line + 1, 0);
      newSelections.push(new vscode.Selection(nextLineStart, nextLineStart));
      continue;
    }

    /*
     * jump to the end of the word
     * and mark range(cursor, end of the word + 1) for deletion.
     */
    for (let token of tokens) {
      if (token.start <= cursor.character && token.end > cursor.character) {
        const wordEnd = new vscode.Position(cursor.line, token.end);
        rangesToDelete.push(new vscode.Range(cursor, wordEnd));
        newSelections.push(new vscode.Selection(wordEnd, wordEnd));
        break;
      }
    }
  }

  return { newSelections, rangesToDelete };
}

function searchBackward(): {
  newSelections: vscode.Selection[];
  rangesToDelete: vscode.Range[];
} {
  const document = vscode.window.activeTextEditor!.document;

  const tokensBySelections = parseAllSelections();

  let newSelections: vscode.Selection[] = [];
  let rangesToDelete: vscode.Range[] = [];

  for (let [selection, tokens] of tokensBySelections) {
    let cursor = selection.start;
    const line = document.lineAt(cursor.line);

    /*
     * if the cursor is not at the beginning of the line,
     * and the character before is whitespace,
     * then mark range(last non-whitespace + 1, cursor) for deletion
     * and move cursor to (last non-whitespace + 1) before it,
     * then continue the process of moving backward.
     */
    if (
      cursor.character !== 0 && isWhiteSpace(line.text[cursor.character - 1])
    ) {
      const nonSpacePos = findLastNonSpace(
        line.text.slice(0, cursor.character),
      );
      const nextPos = nonSpacePos === -1 ? 0 : nonSpacePos;
      const whitespaceStart = new vscode.Position(cursor.line, nextPos + 1);
      rangesToDelete.push(new vscode.Range(whitespaceStart, cursor));
      cursor = whitespaceStart;
    }

    /*
     * if the cursor is at the beginning of the line,
     * and the previous line exists,
     * jump to the end of the previous line.
     */
    if (cursor.character === 0 && cursor.line > 0) {
      const prevLineEnd = document.lineAt(cursor.line - 1).range.end;
      newSelections.push(new vscode.Selection(prevLineEnd, prevLineEnd));
      continue;
    }

    /*
     * jump to the beginning of the word
     * and mark range(the beginning of the word, cursor) for deletion
     */
    for (let token of tokens) {
      if (token.start < cursor.character && token.end >= cursor.character) {
        const wordStart = new vscode.Position(cursor.line, token.start);
        rangesToDelete.push(new vscode.Range(wordStart, cursor));
        newSelections.push(new vscode.Selection(wordStart, wordStart));
        break;
      }
    }
  }

  return { newSelections, rangesToDelete };
}

function findFirstNonSpace(text: string): number {
  return text.search(/[^\s]/);
}

function findLastNonSpace(text: string): number {
  const match = text.match(/(^.*)([^\s])\s*$/);
  if (match === null) {
    return -1;
  }
  return match[1].length + match[2].length - 1;
}

function isWhiteSpace(c: string): boolean {
  return /^[\s]$/.test(c);
}
