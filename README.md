# Jieba for VSCode

基于 `jieba-rs` 的 wasm 版本实现的 VSCode 中文分词插件。

VSCode 本身以及 Vim、Emacs 插件都不具备中文分词功能。比如 Vim 插件只能在以空格或标点符号分割的词语之间跳转，但这明显不适合中文编辑。

这个插件则弥补了 VSCode 在这方面的缺陷，使得用户能够以词为单位，高效编辑中文文本。

本插件的目标为在纯中文以及中英混合文本中模拟 Emacs 风格的单词操作。目前在部分情况下与 Emacs 略有不同，详见“使用建议”部分。

## 使用方式

| 命令                     | 描述                 | 默认键位                      |
|--------------------------|----------------------|-------------------------------|
| `jieba.forwardWord`      | 将光标移至词尾       | `Shift` + `Alt` + `F`         |
| `jieba.backwardWord`     | 将光标移至词首       | `Shift` + `Alt` + `B`         |
| `jieba.killWord`         | 光标前进删除一个词   | `Shift` + `Alt` + `D`         |
| `jieba.backwardKillWord` | 光标后退删除一个词   | `Shift` + `Alt` + `Backspace` |
| `jieba.selectWord`       | 选中光标下方的一个词 | `Shift` + `Alt` + `2`         |

## 示例

![](https://github.com/stephanoskomnenos/vscode-jieba/raw/main/images/chn1.gif)

![](https://github.com/stephanoskomnenos/vscode-jieba/raw/main/images/chn2.gif)

![](https://github.com/stephanoskomnenos/vscode-jieba/raw/main/images/eng.gif)

## 使用建议

### Vim 插件

可以做如下键位绑定：

``` json
"vim.normalModeKeyBindings": [
    {
        "before": ["w"],
        "commands": ["jieba.forwardWord"]
    },
    {
        "before": ["b"],
        "commands": ["jieba.backwardWord"]
    },
    {
        "before": ["d", "w"],
        "commands": ["jieba.killWord"]
    },
    {
        "before": ["d", "b"],
        "commands": ["jieba.backwardKillWord"]
    }
],
```

注意：
- 本插件模拟的是 Emacs 下 `Alt+F`, `Alt+B` 等快捷键的行为。
- 因此，Vim 下的 `w` 和 `b` 与本插件的 `forwardWord` 和 `backwardWord` 并不一致：比如 Vim 下的 `w` 表现为跳至下一词的词首，而本插件的 `forwardWord` 为跳至当前词的末尾。
- 删除的内容将写入系统剪贴板。多指针模式下删除时，剪贴板里将会是第一个指针删除的内容。

### Emacs 插件

**待完成**

注意：
- 本插件在遇到换行符时的行为与 Emacs 不同：比如 Emacs 的 `Alt+F` 会从行尾空格跳转到下一行第一个词的末尾，本插件则是跳转到下一行的行首。
- 删除的内容将写入系统剪贴板。多指针模式下删除时，剪贴板里将会是第一个指针删除的内容。

## 相关项目

- [jieba-rs](https://github.com/messense/jieba-rs)
- [jieba-wasm](https://github.com/fengkx/jieba-wasm)
- [deno-bridge-jieba](https://github.com/ginqi7/deno-bridge-jieba)
