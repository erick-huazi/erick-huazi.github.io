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

## 手机联系与微信二维码

访客在同一部手机上浏览时，可以直接复制微信号；使用另一台设备时，可以扫描二维码。本轮沿用前述四项评分，重点看候选方法能否发现二维码被裁、复制权限被拒、键盘关闭后找不到原入口等问题。

| GitHub 项目 | 场景匹配 | 可验证性 | 接入成本 | 互补性 | 总分 | 采用内容与边界 |
|---|---:|---:|---:|---:|---:|---|
| [Chrome DevTools · a11y-debugging](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/8e1a05ebe6faf1502451394cd3dd10cae1db3425/skills/a11y-debugging/SKILL.md) | 5 | 5 | 5 | 4 | 19/20 | 将技能中的正向与反向 Tab、焦点观测和触控目标检查用于微信弹窗。复用本站 Playwright 检查实际焦点。 |
| [jsQR 1.4.0](https://github.com/cozmo/jsQR/blob/49a9633931fb8030ac2fc9cecc121d6e5a19f9a3/README.md) | 4 | 5 | 5 | 5 | 19/20 | 作为开发依赖读取浏览器截图和原图的 RGBA 像素，比对两次解码所得内容。设备相机的对焦和反光需现场验证。 |
| [W3C ARIA Practices · Modal Dialog](https://github.com/w3c/aria-practices/blob/f14b2490a6728cda85fd7feafbd148b3c3eaf038/content/patterns/dialog-modal/examples/dialog.html) | 5 | 5 | 5 | 3 | 18/20 | 借鉴示例按内容决定初始焦点、关闭后回到触发按钮的做法。本站另行覆盖连续打开的两层弹窗。 |
| [clipboard.js](https://github.com/zenorocha/clipboard.js/blob/899378dee9681dcf4cb3d702c23a3f3cd9f473d8/readme.md) | 5 | 4 | 4 | 3 | 16/20 | 采用出错后选中文字、提示手动复制的交互。上游依赖旧版 `execCommand`，本站沿用原生剪贴板 API。 |

浏览器回归从三个角度验收联系流程。[联系回归脚本](../scripts/check-contact.mjs) · [仓库内的审查 skill](../.agents/skills/portfolio-ui-review/SKILL.md)

- **扫码与保存。** 从访客实际看到的弹窗截取二维码，检查完整边界，再与原图解码结果比对。保留原始名片的下载入口。解码成功和布局完整分别判定，以免二维码的纠错能力掩盖裁切。
- **复制与回焦。** 手机优先展示复制微信号。权限被拒时，手动复制框应选中全部文字。用键盘逐层关闭，先回到微信卡片内的复制按钮，再回到打开卡片的入口。电话、邮箱按各自入口核对。
- **先后顺序。** 连续复制时让后一次请求先失败，再使前一次失败；最终显示的内容应属于后一次请求。另从联系方式发起复制并立即打开微信卡片，随后才返回的旧结果应保留微信卡片当时的界面与焦点。

同一套 24 组 Chrome 交互测试在上一版 `3f90e7e` 通过 16 组，更新后通过 24 组。四种视口的微信卡片截图均解码到原图的同一联系人。另在 320×568 视口触发真实文件下载，校验下载字节与最初提供的名片一致。

## 作品目录与单个案例分享

2026-11-27 沿用四项各 5 分的本站适配量表。访客可能从「全部」选中一个应用，也可能从「过往实践」分享一个案例，收件人应能从独立标签直接看到发送者选中的项目与目录视图。

| GitHub 项目 | 场景匹配 | 可验证性 | 接入成本 | 互补性 | 总分 | 本站采用 |
|---|---:|---:|---:|---:|---:|---|
| [Platform Design Skills · Web](https://github.com/ehmo/platform-design-skills/blob/eeb5d15e610f1ddb8ed9f54a5a935ee5dd852442/skills/web/SKILL.md#8-navigation-and-state-medium) | 5 | 4 | 5 | 5 | 19/20 | 采用其“URL 表达可分享视图”的原则，以项目片段和有效筛选生成分享链接。在本站另加白名单，排除跟踪参数。 |
| [Microsoft CAT Agent Skills · 目录历史测试](https://github.com/microsoft/cat-agent-skills/blob/181cf68702014d05b69ed502e01e76030e98a308/scripts/gallery-history.test.ts#L28-L65) | 5 | 5 | 4 | 4 | 18/20 | 参考其分别核对离开与返回两条历史记录的方法。本站沿用原生 History API，用目录与可见卡片核对恢复的视图。 |
| [Microsoft Playwright CLI skill](https://github.com/microsoft/playwright/blob/80290e838ba588b841e49c0945dc5ac2f2dbc82f/packages/playwright-core/src/tools/skills/playwright-cli/SKILL.md) | 4 | 5 | 5 | 3 | 17/20 | 借鉴导航后读取页面状态的步骤，用现有 Playwright 接口重放往返、刷新和新标签访问。 |

键盘回归从归档目录进入 AIMEGApro，按后退检查焦点是否回到原目录项，再按前进检查项目标题。分享回归在独立新标签打开案例链接，核对筛选与项目。运行时沿用本站的 HTML 与 JavaScript，回归使用现有开发依赖。[目录回归脚本](../scripts/check-catalog.mjs) · [仓库审查技能](../.agents/skills/portfolio-ui-review/SKILL.md)

## FDE 参考库的筛选与对照分享

访客可以分享一次搜索得到的案例列表，也可以把按特定次序摆放的两个案例分享给别人。选型考察打开链接后的内容是否准确，以及访客在查询条件太窄时能否找回案例。

| GitHub 项目 | 场景匹配 | 可验证性 | 接入成本 | 互补性 | 总分 | 在参考库的用法 |
|---|---:|---:|---:|---:|---:|---|
| [Algolia · InstantSearch UI skill](https://github.com/algolia/skills/blob/476d5c32dd249940ab7a7ded3330d9cfb0199ac3/skills/algolia-instantsearch-ui/SKILL.md#L46-L60) | 5 | 5 | 4 | 5 | 19/20 | 采用其成套检验搜索、筛选、空结果与网址恢复的方法。以本地案例重算各主题的命中数，在独立标签核对分享结果。 |
| [nuqs · 参数解析测试](https://github.com/47ng/nuqs/blob/3fb340529b6da70402e8bb93610f1a6d399506d9/packages/nuqs/src/parsers.test.ts#L187-L217) | 5 | 5 | 4 | 4 | 18/20 | 借鉴已知值校验和编码、解析往返的测试。本站以实际案例 ID 为允许集合，两个不同 ID 的排列决定对照顺序，并单测无效组合。 |
| [Impeccable · Clarify](https://github.com/pbakaus/impeccable/blob/2fc5e1459efbbf06d92c7306517c286bf12490cf/skill/reference/clarify.md#L55-L61) | 4 | 3 | 5 | 4 | 16/20 | 采用其针对空结果给出下一步操作的方法。在选定场景为零、其他场景有匹配时，优先保留关键词并放宽场景。 |

本站沿用原生 JavaScript 筛选本地案例。查询回归使用全角英文与中文连写，验证输入、浏览器往返及空结果恢复。对照回归另查接收方看到的左右两列是否保持分享时的顺序。[参考库回归](../scripts/check-reference-discovery.mjs) · [项目 skill](../.agents/skills/portfolio-ui-review/SKILL.md)
