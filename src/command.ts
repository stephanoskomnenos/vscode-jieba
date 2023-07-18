import * as vscode from "vscode";
import { parseSentence } from "./parse";

export function forwardWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const { newSelections } = searchForward();
  editor.selections = newSelections;
}

export function backwardWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const { newSelections } = searchBackward();
  editor.selections = newSelections;
}

export async function killWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const clipboard = vscode.env.clipboard;
  const document = editor.document;

  const { newSelections, rangesToDelete } = searchForward();

  for (const range of rangesToDelete) {
    const textToCut = document.getText(range);
    clipboard.writeText(textToCut);
    break;
  }
  editor.selections = newSelections;
  await editor.edit((edit) => {
    for (const range of rangesToDelete) {
      edit.delete(range);
    }
  });
}

export async function backwardKillWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const clipboard = vscode.env.clipboard;
  const document = editor.document;

  const { newSelections, rangesToDelete } = searchBackward();

  for (const range of rangesToDelete) {
    const textToCut = document.getText(range);
    clipboard.writeText(textToCut);
    break;
  }
  editor.selections = newSelections;
  await editor.edit((edit) => {
    for (const range of rangesToDelete) {
      edit.delete(range);
    }
  });
}

export function selectWord() {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }

  const selections = editor.selections;

  const newSelections: vscode.Selection[] = [];

  for (const selection of selections) {
    const start = selection.start;
    const end = selection.end;
    const lineNum = start.line;

    const wordStartPos = findWordStartPosition(start);
    const wordStart = new vscode.Position(lineNum, wordStartPos);

    const wordEndPos = findWordEndPosition(end);
    const wordEnd = new vscode.Position(lineNum, wordEndPos);

    newSelections.push(new vscode.Selection(wordStart, wordEnd));
  }

  editor.selections = newSelections;
}

function searchForward(): {
  newSelections: vscode.Selection[];
  rangesToDelete: vscode.Range[];
} {
  const document = vscode.window.activeTextEditor!.document;
  const selections = vscode.window.activeTextEditor!.selections;

  const newSelections: vscode.Selection[] = [];
  const rangesToDelete: vscode.Range[] = [];

  for (const selection of selections) {
    let cursor = selection.start;
    const line = document.lineAt(cursor.line);

    if (cursor.isEqual(line.range.end) && document.lineCount === cursor.line + 1) {
      newSelections.push(new vscode.Selection(cursor, cursor));
      continue;
    }

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

      if (cursor.isEqual(line.range.end)) {
        newSelections.push(new vscode.Selection(cursor, cursor));
        continue;
      }
    }

    /*
     * if the cursor is at the end of the line
     * and the next line exists,
     * then jump to the beginning of the next line.
     */
    if (cursor.isEqual(line.range.end) && document.lineCount > cursor.line + 1) {
      const nextLineStart = new vscode.Position(cursor.line + 1, 0);
      newSelections.push(new vscode.Selection(nextLineStart, nextLineStart));
      continue;
    }

    const wordEndPos = findWordEndPosition(cursor);
    const wordEnd = new vscode.Position(cursor.line, wordEndPos);

    rangesToDelete.push(new vscode.Range(cursor, wordEnd));
    newSelections.push(new vscode.Selection(wordEnd, wordEnd));
  }

  return { newSelections, rangesToDelete };
}

function searchBackward(): {
  newSelections: vscode.Selection[];
  rangesToDelete: vscode.Range[];
} {
  const document = vscode.window.activeTextEditor!.document;
  const selections = vscode.window.activeTextEditor!.selections;

  const newSelections: vscode.Selection[] = [];
  const rangesToDelete: vscode.Range[] = [];

  for (const selection of selections) {
    let cursor = selection.start;
    const line = document.lineAt(cursor.line);

    if (cursor.character === 0 && cursor.line === 0) {
      newSelections.push(new vscode.Selection(cursor, cursor));
      continue;
    }

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
      const whitespaceStart = new vscode.Position(cursor.line, nonSpacePos + 1);
      rangesToDelete.push(new vscode.Range(whitespaceStart, cursor));
      cursor = whitespaceStart;

      if (cursor.character === 0) {
        newSelections.push(new vscode.Selection(cursor, cursor));
        continue;
      }
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

    const wordStartPos = findWordStartPosition(cursor);
    const wordStart = new vscode.Position(cursor.line, wordStartPos);

    rangesToDelete.push(new vscode.Range(wordStart, cursor));
    newSelections.push(new vscode.Selection(wordStart, wordStart));
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

function findFirstSpaceAfterNonCJK(text: string): number {
  const match = text.match(/^(\s*\w+(?<![\u4e00-\u9fff]))\b/);
  if (match === null) {
    return -1;
  }
  return match[1].length;
}

function findLastSpaceBeforeNonCJK(text: string): number {
  const match = text.match(/\b\w+(?<![\u4e00-\u9fff])\s*$/);
  if (match === null) {
    return -1;
  }
  return text.length - match[0].length;
}

function findWordStartPosition(cursor: vscode.Position): number {
  const line = vscode.window.activeTextEditor!.document.lineAt(cursor.line);

  const wordStartPos = findLastSpaceBeforeNonCJK(line.text.slice(0, cursor.character));

  // non CJK context
  if (wordStartPos !== -1) {
    return wordStartPos;
  }

  /*
   * in CJK context
   * jump to the beginning of the word
   * and mark range(the beginning of the word, cursor) for deletion
   */
  const tokens = parseSentence(line.text);
  const target = tokens.find((token) => {
    return token.start < cursor.character && token.end >= cursor.character;
  })!;
  return target.start;
}

function findWordEndPosition(cursor: vscode.Position): number {
  const line = vscode.window.activeTextEditor!.document.lineAt(cursor.line);

  const wordEndPos = findFirstSpaceAfterNonCJK(line.text.slice(cursor.character));

  // non-CJK context
  if (wordEndPos !== -1) {
    return cursor.character + wordEndPos;
  }

  /*
   * in CJK-context
   * jump to the end of the word
   * and mark range(cursor, end of the word + 1) for deletion.
   */
  const tokens = parseSentence(line.text);
  const target = tokens.find((token) => {
    return token.start <= cursor.character && token.end > cursor.character;
  })!;
  return target.end;
}