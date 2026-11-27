---
name: portfolio-ui-review
description: Review the Erick Zhang portfolio’s homepage motion and first paint, project directory, reference library, shared links, browser history, contact and clipboard flows, WeChat QR card, quick search, inquiry form and screenshot viewer. Replay visitor workflows after changes.
---

# 作品站交互验收

在含 `package.json` 和 `dist/` 的仓库根目录操作。复现时记录视口、输入方式、操作入口、预期结果和实际焦点。

| 操作 | 审查重点 | 维护位置 |
|---|---|---|
| 查看首页作品图 | 检查首帧标题与入口、触屏点击、站内暂停和系统减弱动画，核对首屏取图与真实案例详情。 | `dist/motion.js`、`dist/index.html`、`scripts/check-home-motion.mjs` |
| 浏览与分享作品 | 对照筛选、目录和可见作品。在新标签打开分享地址，检查项目、视图和浏览器往返。 | `dist/main.js`、`scripts/check-catalog.mjs` |
| 联系张建华 | 手机可直接复制微信号；二维码显示完整、能解码、能保存原图。复制被拒后检查选区和键盘返回路径。 | `dist/index.html`、`dist/main.js`、`scripts/check-contact.mjs` |
| 快速前往 | 输入框持有焦点，活动选项可见且与 ARIA 状态一致。验证混合中英文、无结果、模糊搜索不可用、输入法确认和普通回车。 | `dist/main.js`、`dist/v70-overlays.css` |
| 整理咨询需求 | 空白提交后逐项纠错。比对实际填写内容、来信与邮件草稿，检查编辑后旧预览是否失效。 | `dist/index.html`、`dist/main.js`、`dist/v70-sections.css` |
| 查看作品实屏 | 适应模式应显示完整长图，原尺寸可平移；横屏能切换，关闭后回到原入口。 | `dist/v70-overlays.css`、`dist/main.js` |
| 查找与分享 FDE 参考 | 对照关键词、主题计数和可见案例，在新标签打开筛选链接或一组案例，检查结果及对照顺序。 | `dist/reference-library.js`、`dist/reference-compare.js`、`scripts/check-reference-discovery.mjs` |
| 对照公开案例 | 键盘选满两项后进入对照。检查移除选项后的焦点和章节标题与固定栏的位置。 | `dist/reference-compare.js`、`dist/v70-reference.css`、`scripts/build-references.mjs` |

安装开发依赖后执行 `npm run build`。在一个终端运行 `python -m http.server 8000 --bind 127.0.0.1 --directory dist`，在另一个终端运行 `npm run check:interactions`。复用已有本地预览时可传地址。默认启动本机 Chrome，`PORTFOLIO_BROWSER_CHANNEL=msedge` 可选择已安装的 Edge。

规则审查参考 [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines/references/command.md)。测试步骤结合 [Anthropic Webapp Testing](https://github.com/anthropics/skills/blob/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing/SKILL.md) 与 [Accessibility Runtime Tester](https://github.com/github/awesome-copilot/blob/93fc8b9ee3ef56b9b5e7261e6ce92d314cb2c1cf/agents/accessibility-runtime-tester.agent.md)。搜索的焦点和选中状态参考 [W3C 组合框测试](https://github.com/w3c/aria-practices/blob/f14b2490a6728cda85fd7feafbd148b3c3eaf038/test/tests/combobox_autocomplete-list.js)。

脚本在本地测试页面加载 axe-core，检查搜索弹窗和咨询出错、生成状态。报告区分自动规则、直接操作和模拟输入事件。输入法、读屏及触屏的实体设备体验要以对应设备实测为准。

## 微信与其他联系方式

1. 从首页打开微信卡片。在手机竖屏和短横屏确认首屏能看到完整码图，关闭、复制微信号和保存原图都能直接点到。保存目标应是 `assets/wechat-qr.jpg`。用开发依赖 jsQR 分别解码实际视口截图与原图，两边应返回相同的非空内容。另查图像边界，确保码区、留白和说明完整可见。
2. 检查自动复制成功和权限被拒两条路径。前者核对实际写入值，后者核对手动复制框内的完整选区。微信号应为 `ErickX1024`。用 Tab 和 Shift+Tab 检查当前弹窗，按 Escape 关闭手动复制框后应回到「复制微信号」，再关闭微信卡片应回到最初打开它的入口。从电话或邮箱直接进入手动复制时，关闭后应回到相应按钮。
3. 用可控的剪贴板 Promise 连续触发两次复制，先拒绝后发请求，再拒绝先发请求。确认选区内容、可见弹窗和焦点仍属于最后一次操作。另测从电话或邮箱发起复制，在结果返回前打开微信卡片；旧请求结束后，微信卡片和焦点应保持在当前步骤。

将评分、上游版本及方法边界记录在[项目选型](../../../docs/portfolio-ui-skills.md)。截图解码覆盖该次浏览器渲染；手机微信的相机识别和系统长按菜单需在实体设备验证。

## 作品目录、分享与返回

1. 从「作品」依次浏览应用、过往实践和全部。逐次核对选中控件、目录和可见卡片，预期分别为 5、3、8 项。用浏览器后退、前进，检查对应历史项的视图；刷新后核对 URL 对应的筛选。
2. 带一个跟踪参数打开目录，进入某个具体案例后复制该案例链接。核对链接的片段是案例 ID，查询只保留该目录视图需要的参数。复制链接本身应保留当前阅读位置。
3. 在独立新标签粘贴链接，检查对应卡片和选中的目录视图。分别覆盖默认应用、归档实践以及从「全部」分享的案例。这样能发现依赖上一页内存或滚动状态的链接。
4. 打开 `/?view=archive#work`，在目录用键盘进入 AIMEGApro。后退应回到启动导航的目录项，前进应回到项目标题。再折叠实践列表后切换分类并后退，检查恢复的展开状态。

## 查找与分享公开参考案例

1. 在全部案例中输入 `ＡＷＳ维修`，核对 Cox 案例和每个场景的可用数量。再选择场景，核对结果卡片和总数。换成没有匹配的词，在手机上通过空结果区恢复浏览。
2. 在同一次输入中连续修改关键词，按一次后退应回到输入前的筛选，前进应恢复最终输入。中文输入法组词时检查候选阶段的结果和地址，确认上屏后再更新。模拟输入事件及实机输入法应分别记录。
3. 从带跟踪参数的页面分享当前筛选，在新标签核对主题、关键词和可见案例。结果链接只保留有效的 `topic`、`q` 和 `#cases`。
4. 按 B、A 的顺序选择两个不同案例并分享对照，在新标签直接打开，核对两列的名称及顺序。再分别打开含重复 ID、未知 ID 或仅一个 ID 的 `compare` 参数，确认页面仍可浏览，并且不会显示错误的案例组合。

## 首页动效与首屏资源

1. 首次打开首页，在动画的第一帧与结束时分别检查姓名、定位、主要操作和作品链接。窄屏及短横屏用实际命中点检查触控入口。按正常速度观察作品图入场，再用系统减弱动态和站内暂停检查对应的静态排版。
2. 在两个同源标签之间切换站内开关，确认偏好同步。打开与收起系统减弱动画设置，复核开关显示、实际动画及作品入口。检查预览光标离开作品图、页面转入后台和返回前台时的帧调度；分别记录真实切换和模拟的可见性事件。
3. 测量加载时固定视口、像素比、CPU 与网络条件，使用冷缓存。用 PerformanceObserver 记录 LCP 的元素与时刻，从网络记录核对首页 JMSAI 图片的实际地址与字节数，再打开作品详情核对原图。记录本地采样次数和条件；访客现场数据单独标注来源。

## 从作品或公开案例发起咨询

1. 从作品打开咨询，核对选中的作品及服务。先只修改服务，再走另一个作品入口，核对手选服务得以保留、作品随新入口更新。反向操作一次，并特意手动清空作品，再走入口。填写昵称、需求、沟通方式及时间后切换入口，核对每一项原值。
2. 从参考库按不同于列表的顺序选两个公开案例，再进入咨询。在新标签核对两个案例及原文地址，返回原标签核对对照顺序。已有的本站作品和附上的外部案例应各自标明来源。取消附上后再生成需求单，核对外部案例已移除。
3. 编辑一项已预览的内容，重新生成预览。逐行比对预览正文、邮件草稿解码后的正文与实际下载的 UTF-8 文本，重点核对作品锚点、原文地址和访客换行。用独立标签打开咨询链接，核对公开入口的预选值，同时检查地址中不会出现访客填写的需求或联系方式。
