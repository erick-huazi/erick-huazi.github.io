# 作品站的交互审查与 skill 选型

2026-11-26 针对两条访客操作评分：查看真实项目截图和对照两个外部案例。各维度满分 5 分。场景匹配看是否覆盖这些操作，可验证性看能否重放并断言结果，接入成本分数越高表示额外依赖越少，互补性看相对本站既有检查新增多少覆盖。

| GitHub 项目 | 场景匹配 | 可验证性 | 接入成本 | 互补性 | 总分 | 本次选择 |
|---|---:|---:|---:|---:|---:|---|
| [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines/references/command.md) | 5 | 4 | 5 | 4 | 18/20 | 用固定规则审查键盘焦点、遮挡、窄屏行为，转成可观测的验收条件。 |
| [Anthropic Webapp Testing](https://github.com/anthropics/skills/blob/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing/SKILL.md) | 5 | 5 | 4 | 4 | 18/20 | 借鉴本地 Playwright 实测方法，结合本站 Node 工具链编写回归脚本。 |
| [Impeccable Audit](https://github.com/pbakaus/impeccable/blob/2fc5e1459efbbf06d92c7306517c286bf12490cf/skill/reference/audit.md) | 4 | 4 | 4 | 3 | 15/20 | 适合检查视觉层级、响应式和对比度。本站此前已做过此类检查，这轮优先投入能复现的操作问题。 |

## 实际结果

旧版 `d6f5562` 与新版运行相同的 8 组浏览器场景。320×568、390×844、844×390、1280×800 四个视口各测试一次图集和一次案例对照。旧版 1 组通过、7 组失败；新版 8 组通过。这是针对本轮问题的回归结果。

- 在 1280×800 的旧版，1200px 高的 JMSAI 截图挤进约 400px 高的画框。新版适应模式显示完整截图，原尺寸模式可以平移。横屏下的下一张按钮可直接点击。
- 在 390×844 的旧版，用键盘选中第二项后还要按 38 次 Tab 才能到达打开按钮。新版自动将键盘焦点移至该按钮，Enter 打开，Escape 回到入口。清空或移除案例后，焦点回到剩余选项、相关案例或搜索框。
- 对照弹窗只保留一处固定标题偏移。跳到「做法」时，章节标题紧跟在固定栏下方。

[仓库内的审查 skill](../.agents/skills/portfolio-ui-review/SKILL.md) · [浏览器回归脚本](../scripts/check-interactions.mjs)

## 搜索与合作咨询的选型

沿用上述四维量表评估第二轮候选。目标是让访客用键盘找到作品，并生成反映本人意愿的咨询来信。

| 项目 | 场景匹配 | 可验证性 | 接入成本 | 互补性 | 总分 | 本次采用 |
|---|---:|---:|---:|---:|---:|---|
| [GitHub Awesome Copilot · Accessibility Runtime Tester](https://github.com/github/awesome-copilot/blob/93fc8b9ee3ef56b9b5e7261e6ce92d314cb2c1cf/agents/accessibility-runtime-tester.agent.md) | 5 | 4 | 5 | 5 | 19/20 | 采用其运行时审查方法，验证键盘搜索、表单出错和修正后的实际状态。 |
| [W3C ARIA Practices · Combobox](https://github.com/w3c/aria-practices/blob/f14b2490a6728cda85fd7feafbd148b3c3eaf038/test/tests/combobox_autocomplete-list.js) | 4 | 5 | 4 | 5 | 18/20 | 参考可执行的组合框测试，在本站断言活动选项、输入焦点、方向键与确认行为。 |
| [Deque axe-core](https://github.com/dequelabs/axe-core/blob/e797173108eadfa4355fe06af331791734e1757f/doc/API.md) | 4 | 4 | 5 | 4 | 17/20 | 复用已锁定的 4.14.0 开发依赖，在 Playwright 打开真实状态后扫描指定区域。 |
| [Microsoft VS Code Accessibility skill](https://github.com/microsoft/vscode/blob/5ed23da5a646d452ec58eaa62fcfa68968189671/.github/skills/accessibility/SKILL.md) | 3 | 4 | 2 | 2 | 11/20 | 其工作台视图和扩展宿主要求限制了对普通网页的直接复用，保留作参考。 |

本轮的 agent 方法归入 [本站 skill](../.agents/skills/portfolio-ui-review/SKILL.md)，W3C 的行为预期写入 [搜索回归](../scripts/check-interactions.mjs)，表单状态由 [咨询回归](../scripts/check-inquiry.mjs) 检查。开发依赖只在测试中加载。

- 搜索三种实际写法 `HYALORIA工作台`、`多模型API`、`JMSAI选股`。区分输入法候选词确认与选择站内结果的回车。
- 检查未填写、选择了方式和时间、重新编辑这三种咨询来信。沟通偏好根据实际输入生成。
- 在短视口核对弹窗、当前结果和底部帮助的可见边界。在搜索弹窗及咨询报错、生成状态对 axe 的指定区域扫描结果作断言。

用相同的 16 组场景在上一版 d6882d1 和本版 Chrome 中复测：上一版通过 8 组，本版通过 16 组。四个视口各覆盖实屏图集、快速前往、案例对照与咨询来信。新版 12 次局部 axe 扫描均通过；输入法候选确认使用模拟事件验证。
