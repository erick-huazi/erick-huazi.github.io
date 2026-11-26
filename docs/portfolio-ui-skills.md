# 作品图集与参考库的 skill 选型

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
