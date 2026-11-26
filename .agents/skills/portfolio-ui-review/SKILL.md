---
name: portfolio-ui-review
description: Review the Erick Zhang portfolio’s quick search, inquiry form, project screenshot viewer and FDE comparison. Replay keyboard, layout and data-integrity regressions after changes to these visitor flows.
---

# 作品站交互验收

在含 `package.json` 和 `dist/` 的仓库根目录操作。复现时记录视口、输入方式、操作入口、预期结果和实际焦点。

| 操作 | 审查重点 | 维护位置 |
|---|---|---|
| 快速前往 | 输入框持有焦点，活动选项可见且与 ARIA 状态一致。验证混合中英文、无结果、模糊搜索不可用、输入法确认和普通回车。 | `dist/main.js`、`dist/v70-overlays.css` |
| 整理咨询需求 | 空白提交后逐项纠错。比对实际填写内容、来信与邮件草稿，检查编辑后旧预览是否失效。 | `dist/index.html`、`dist/main.js`、`dist/v70-sections.css` |
| 查看作品实屏 | 适应模式应显示完整长图，原尺寸可平移；横屏能切换，关闭后回到原入口。 | `dist/v70-overlays.css`、`dist/main.js` |
| 对照公开案例 | 键盘选满两项后进入对照。检查移除选项后的焦点和章节标题与固定栏的位置。 | `dist/reference-compare.js`、`dist/v70-reference.css`、`scripts/build-references.mjs` |

安装开发依赖后执行 `npm run build`。在一个终端运行 `python -m http.server 8000 --bind 127.0.0.1 --directory dist`，在另一个终端运行 `npm run check:interactions`。复用已有本地预览时可传地址。默认启动本机 Chrome，`PORTFOLIO_BROWSER_CHANNEL=msedge` 可选择已安装的 Edge。

规则审查参考 [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines/references/command.md)。测试步骤结合 [Anthropic Webapp Testing](https://github.com/anthropics/skills/blob/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing/SKILL.md) 与 [Accessibility Runtime Tester](https://github.com/github/awesome-copilot/blob/93fc8b9ee3ef56b9b5e7261e6ce92d314cb2c1cf/agents/accessibility-runtime-tester.agent.md)。搜索的焦点和选中状态参考 [W3C 组合框测试](https://github.com/w3c/aria-practices/blob/f14b2490a6728cda85fd7feafbd148b3c3eaf038/test/tests/combobox_autocomplete-list.js)。

脚本在本地测试页面加载 axe-core，检查搜索弹窗和咨询出错、生成状态。报告区分自动规则、直接操作和模拟输入事件。输入法、读屏及触屏的实体设备体验要以对应设备实测为准。