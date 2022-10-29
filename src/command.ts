import * as vscode from "vscode";
import { parseAllSelections, Token } from "./parse";

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
    const start = selection.start;
    const lineNum = start.line;
    const charNum = start.character;
    const line = document.lineAt(lineNum);

    /*
     * if the cursor is not at the end of the line
     * and the character after is whitespace,
     * then jump to the next non-whitespace character
     * and mark range(cursor, next non-whitespace) for deletion.
     */
    if (
      charNum !== line.range.end.character &&
      isWhiteSpace(line.text[charNum])
    ) {
      const nonSpacePos = findFirstNonSpace(line.text.slice(charNum));
      const nextPos = nonSpacePos === -1 ? 0 : charNum + nonSpacePos;
      const nextNonSpace = new vscode.Position(lineNum, nextPos);
      rangesToDelete.push(new vscode.Range(start, nextNonSpace));
      newSelections.push(new vscode.Selection(nextNonSpace, nextNonSpace));
      break;
    }

    /*
     * if the cursor is at the end of the line
     * and the next line exists,
     * then jump to the beginning of the next line.
     */
    if (
      start.isEqual(line.range.end) &&
      document.lineCount > lineNum + 1
    ) {
      const nextLineStart = new vscode.Position(lineNum + 1, 0);
      newSelections.push(
        new vscode.Selection(nextLineStart, nextLineStart),
      );
      break;
    }

    /*
     * jump to the end of the word
     * and mark range(cursor, end of the word + 1) for deletion.
     */
    for (let token of tokens) {
      if (token.start <= charNum && token.end > charNum) {
        const wordEnd = new vscode.Position(lineNum, token.end);
        rangesToDelete.push(new vscode.Range(start, wordEnd));
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
    const start = selection.start;
    const lineNum = start.line;
    const charNum = start.character;
    const line = document.lineAt(lineNum);

    /*
     * if the cursor is not at the beginning of the line,
     * and the character before is whitespace,
     * jump to the last non-whitespace before the cursor
     * and mark range(last non-whitespace, cursor) for deletion.
     */
    if (charNum !== 0 && isWhiteSpace(line.text[charNum - 1])) {
      const nonSpacePos = findLastNonSpace(line.text.slice(0, charNum));
      const prevPos = nonSpacePos === -1
        ? line.range.end.character
        : nonSpacePos;
      const prevNonSpace = new vscode.Position(lineNum, prevPos);
      rangesToDelete.push(new vscode.Range(prevNonSpace, start));
      newSelections.push(new vscode.Selection(prevNonSpace, prevNonSpace));
      break;
    }

    /*
     * if the cursor is at the beginning of the line,
     * and the previous line exists,
     * jump to the end of the previous line.
     */
    if (charNum === 0 && lineNum > 0) {
      const prevLineEnd = document.lineAt(lineNum - 1).range.end;
      newSelections.push(new vscode.Selection(prevLineEnd, prevLineEnd));
      break;
    }

    /*
     * jump to the beginning of the word
     * and mark range(the beginning of the word, cursor) for deletion
     */
    for (let token of tokens) {
      if (token.start < charNum && token.end >= charNum) {
        const wordStart = new vscode.Position(lineNum, token.start);
        rangesToDelete.push(new vscode.Range(wordStart, start));
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
