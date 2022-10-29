# Jieba for VSCode

基于 `jieba-rs` 的 wasm 版本实现的 VSCode 中文分词插件。

VSCode 本身以及 Vim、Emacs 插件都不具备中文分词功能。比如 Vim 插件只能在以空格或标点符号分割的词语之间跳转，但这明显不适合中文编辑。

这个插件则弥补了 VSCode 在这方面的缺陷，使得用户能够以词为单位，高效编辑中文文本。

## 使用方式

| 命令                     | 描述                 | 默认键位                  |
|--------------------------|----------------------|---------------------------|
| `jieba.forwardWord`      | 将光标移至词尾       | `Shift`+`Alt`+`F`         |
| `jieba.backwardWord`     | 将光标移至词首       | `Shift`+`Alt`+`B`         |
| `jieba.killWord`         | 光标前进删除一个词   | `Shift`+`Alt`+`D`         |
| `jieba.backwardKillWord` | 光标后退删除一个词   | `Shift`+`Alt`+`Backspace` |
| `jieba.selectWord`       | 选中光标下方的一个词 | `Shift`+`Alt`+`2`         |


## 示例

![](https://github.com/stephanoskomnenos/vscode-jieba/raw/main/images/example.gif)

## 相关项目

- [jieba-rs](https://github.com/messense/jieba-rs)
- [jieba-wasm](https://github.com/fengkx/jieba-wasm)
- [deno-bridge-jieba](https://github.com/ginqi7/deno-bridge-jieba)