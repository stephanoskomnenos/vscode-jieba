import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import {
  backwardKillWord,
  backwardWord,
  forwardWord,
  killWord,
} from "../../command";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Basic test", basicTest);
  test("English test", englishTest);
});

const chnText = "“自由软件”尊重用户的自由，并且尊重整个社区。";

const engText =
  "“Free software” means software that respects users' freedom and community. ";

async function basicTest() {
  const doc = await vscode.workspace.openTextDocument();
  await vscode.window.showTextDocument(doc);
  const editor = vscode.window.activeTextEditor;
  assert.ok(editor !== undefined);

  const startPos = new vscode.Position(0, 0);
  await editor.edit((edit) => {
    edit.insert(startPos, chnText);
  });
  editor.selection = new vscode.Selection(startPos, startPos);

  for (let i = 0; i < 3; i++) {
    forwardWord();
  }
  // 光标在"尊"字上
  assert.strictEqual(editor.selection.start.character, 6);

  for (let i = 0; i < 3; i++) {
    forwardWord();
  }
  // 光标在“自”字上
  assert.strictEqual(editor.selection.start.character, 11);

  await killWord();
  assert.strictEqual(editor.selection.start.character, 11);
  assert.strictEqual(
    editor.document.getText(
      new vscode.Range(new vscode.Position(0, 11), new vscode.Position(0, 14)),
    ),
    "，并且",
  );

  for (let i = 0; i < 3; i++) {
    backwardWord();
  }
  for (let i = 0; i < 3; i++) {
    await backwardKillWord();
  }
  assert.ok(editor.selection.start.isEqual(new vscode.Position(0, 0)));
}

async function englishTest() {
  const doc = await vscode.workspace.openTextDocument();
  await vscode.window.showTextDocument(doc);
  const editor = vscode.window.activeTextEditor;
  assert.ok(editor !== undefined);

  const startPos = new vscode.Position(0, 0);
  await editor.edit((edit) => {
    edit.insert(startPos, engText);
  });
  editor.selection = new vscode.Selection(startPos, startPos);

  for (let i = 0; i < 20; i++) {
    forwardWord();
  }

  assert.strictEqual(
    editor.selection.start.isEqual(editor.document.lineAt(0).range.end),
    true,
  );

  await killWord();

  for (let i = 0; i < 5; i++) {
    backwardWord();
  }
  for (let i = 0; i < 20; i++) {
    await backwardKillWord();
  }

  assert.strictEqual(
    editor.selection.start.isEqual(editor.document.lineAt(0).range.start),
    true,
  );
}
