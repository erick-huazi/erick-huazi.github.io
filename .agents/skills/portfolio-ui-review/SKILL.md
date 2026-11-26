---
name: portfolio-ui-review
description: Review the Erick Zhang portfolio’s screenshot viewer and FDE case comparison when changing their layout, keyboard flow or touch behavior. Replay the project’s browser regression checks and report measured differences.
---

# 图集与案例对照验收

在包含 `package.json` 和 `dist/` 的网站仓库根目录执行。样式源是 `dist/v70-overlays.css` 和 `dist/v70-reference.css`。参考页标记来自 `scripts/build-references.mjs`，交互来自 `dist/reference-compare.js`。

先从有问题的操作进入页面，记录视口、打开入口、焦点和可见内容。图集检查适应模式能否容纳完整长图、原尺寸能否平移、关闭后焦点落在哪里。对照阅读检查键盘选满两项后的下一步，筛选掉原案例后移除选择时的焦点，以及固定标题是否挡住当前章节。

使用仓库固定的 Playwright 版本重放。安装开发依赖后运行 `npm run build`，在一个终端运行 `python -m http.server 8000 --bind 127.0.0.1 --directory dist`，另一个终端运行 `npm run check:interactions`。已有本地预览时可以传地址，例如 `npm run check:interactions -- http://127.0.0.1:8080/`。默认启动已安装的 Chrome；可将 `PORTFOLIO_BROWSER_CHANNEL` 设为 `msedge` 以使用已安装的 Edge。

报告实际失败的操作和修复前后差异。超出自动检查的手势、实体设备或读屏行为按实测范围说明。审查依据来自 [Vercel 的固定版界面规则](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines/references/command.md)；本地浏览器复现流程借鉴 [Anthropic Webapp Testing](https://github.com/anthropics/skills/blob/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing/SKILL.md)。本站使用 Node 版 Playwright。
