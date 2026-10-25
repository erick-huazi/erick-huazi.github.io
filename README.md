# Erick 张建华 · FDE 个人主页

公开访问：https://erick-huazi.github.io/  
参考库：https://erick-huazi.github.io/references.html

静态 HTML、CSS 和原生 JavaScript。包含个人作品、合作服务、联系方式，以及注明来源的 Datawhale / FDE 参考库。外部案例不代表本人经历或合作背书。

## 本地预览

```sh
python -m http.server 8642 --directory dist
```

打开 http://127.0.0.1:8642/ 。预览无需安装 Node 依赖。

## 修改与构建

需要 Node.js 22 或兼容版本。构建工具版本固定在 package-lock.json。

```sh
npm ci --ignore-scripts
npm run build
npm run check:search
python scripts/check-static.py
```

- `src/reference-library.json`：参考案例、分类与官方来源。
- `scripts/build-references.mjs`：生成参考页和项目模板。
- `dist/reference-library.*`：筛选与阅读界面。
- `dist/reference-teaser.css`：v27 首页参考书架，三条原生链接直达 Agent、RAG 与企业案例；组件样式集中于此，已移除 editorial.css 的旧覆盖。
- `dist/reference-compare.*`：双案例对照与本地笔记下载。
- `dist/index.html`、`main.js`：个人主页及业务交互。
- `dist/editorial.css`、`editorial-motion.css`、`motion.js`：v25 项目展板、作品编排与可关闭动效。
- `dist/reference-editorial.css`：v27 参考库案例目录：桌面按机构与正文分栏，手机沿 DOM 单列，v30 学习路径使用独立书册布局，资料性质持续可见，章节入口和原生阅读笔记分层展示。
- `dist/reference-reading.css`、`reference-reading.js`：v23 章节导航、阅读位置与案例定位入口。
- `dist/navigation-editorial.css`、`contact-editorial.css`：手机导航、搜索与 v28 联系区域、名片式微信弹窗。
- `dist/about-editorial.css`：v25 人物介绍、经验事实和签名的编辑式排版。
- `dist/project-viewer.css`、`main.js` 中作品查看器：站内实屏放大，原始图片链接作为无脚本退路。
- `scripts/build-assets.mjs`：生成 `site.css` 与优化图片，避免直接编辑生成文件。

v21 首屏展示真实作品界面，使用 700/1400 两档 WebP；旧抽象圆环资源保留归档，主页不再加载。分享卡使用同一姓名排版。动画尊重系统“减少动态效果”和站内暂停设置；关闭后文字、链接和项目保持可见。修改快速导航后，检查键盘选中项始终可见、关闭重开回到首项，以及跨页入口是否正确。参考库筛选会清除当前结果链接的旧锚点；需回归浏览器前进/后退的位置恢复、带筛选参数的首次访问和案例深链接。

v25 作品标题位于 `.case-heading`，画面与说明使用具名网格分区；手机按 DOM 顺序展示。真实画面首次进入视野时有短展开动效，暂停与键盘聚焦会立即恢复完整画面；筛选恢复不重播。

v26 合作区使用 `.service-layout`：大屏左侧说明、右侧服务手册，<=1100px 分为上下层；展开交付列表始终单列，覆盖历史平板三列规则。合作流程为大屏4列、平板2列、手机1列。`#inquiry-details` 使用 `tabindex=-1` 支持原生锚点聚焦，键盘可继续进入表单；不要改成自动聚焦输入框。

v29 过往项目使用 `.archive-identity` / `.archive-body` 两栏履历，<=760px按DOM单列。闭合展示简述与交付，展开保留参与范围、方法与原简历来源。选择“过往实践”时同时隐藏独立产品容器与重复目录，避免留下空白；返回独立产品/全部作品时恢复。保留项目ID、原生details和筛选历史。

v28 微信弹窗将身份、微信号与复制入口放在图片之前；桌面两列、手机单列，关闭栏在短屏滚动时保持可见。保留完整原二维码与原图下载。手动复制回退按短联系方式 / 长需求文本使用不同高度，仍保持只读、自动全选与关闭后焦点返回。弹窗入场动效遵循站内暂停与系统减少动态设置。

作品查看器修改后，检查打开/关闭、Esc、遮罩、返回焦点和窄屏滚动；Ctrl/Meta/Shift 点击必须继续使用原始链接。联系区改动需检查填写需求、生成内容、手机输入框及完整联系方式。

参考库章节导航保留原生锚点，无脚本时也可使用。修改后检查 320px 小屏、页头换行、筛选和详情展开后的当前章节；直达案例的标题不应被固定导航遮挡。案例链接指向已有稳定 ID，来源核验日期只在重新核验资料后更新。

首页响应式规则统一使用 `body.portfolio-v21` 作用域，包括逗号分隔选择器的每一项，避免桌面规则因优先级更高压住手机规则。移动端检查不仅看横向溢出，还要确认两个独立项目都为单列、按标题、画面、说明依次阅读、服务标题和交付内容有完整阅读宽度，并检查 760/761px 断点两侧。

v30 学习内容由独立 `learningCard()` 生成，保留原条目 ID、全部资料事实和来源，避免影响案例对照 DOM。阅读笔记使用原生 details；脚本不可用时仍可展开。直达学习链接定位卡片概览，不强制展开笔记。项目梳理四步及模板内容保持一致；下载入口与合作入口集中收尾。

v31 需求整理使用 `.inquiry-workspace`：桌面表单与来信并排，平板/手机依次展示。沟通偏好是原生可选折叠，字段继续保留在 form 内；生成结果动作在全文之前。`#summary-placeholder` 与结果交替显示，返回修改仅聚焦需求框，输入后才使旧结果失效。保持场景模板不覆盖手写需求、长邮件降级、复制回退与完整文本下载。

## v32 维护说明

快捷搜索覆盖13个真实入口，需求入口会先展开工具；面板固定顶部，避免结果数量变化时输入框上下跳动；结果区独立滚动，短屏压缩非必要说明。空结果时收起listbox并同步aria-expanded，清空后恢复。联系复制与主页复制按钮在监听绑定后显示；需求工具保留静态未就绪提示，成功初始化后隐藏。不要移除这些脚本缺失时的退路。

案例对照按问题、做法、借鉴、资料边界逐项配对，手机在每个维度内先后阅读A/B。弹窗内章节定位保持页面URL与浏览历史不变；关闭返回对照入口，重新打开滚动归零。核验700/701px、短屏、下载状态撑高粘性标题、筛选后保留选择和空结果时移除最后一项的返焦。目录编号保持nowrap并预留两位数字宽度。

样式剪裁只使用 `src/retired-style-symbols.json` 中明确列出的 43 个退役类：20 个旧雕塑首屏类、23 个旧项目示意类。19 份源 CSS 及其顺序保留，构建时交给 LightningCSS 的 `unusedSymbols` 处理，不自动猜测“未使用”样式。不要按版本号直接删除旧层或 body 类；它们仍承载弹窗、筛选、表单和动态状态的基础规则。

```sh
node scripts/check-retired-styles.mjs
```

这条命令只读核查运行来源，执行 HTML 与 `classList` 复用检测，并在内存中报告剪裁前后的 CSS / gzip 字节数。`npm run build` 也会先运行退役名单核查：首页内外脚本及按需搜索模块中的字面量复用会使构建失败；外部脚本和无法核验的计算式 `import()` 也不会静默跳过。恢复旧界面时先从名单移除对应类；新增脚本加载方式时同步检查覆盖范围。该检查不代替动态交互和响应式回归。

CSS 缓存指纹包含源样式、退役名单、检查器以及实际读取的运行来源，缓存命中还会核验生成文件 SHA-256。`build-report.json` 的 `css.retiredStyles` 记录本次名单和来源；`src/build-baseline.json` 保持发布版 v15 的冻结基线，不随优化重写。

参考库分享图使用 `src/reference-share-card.svg`，由 `src/reference-library.json` 的 `cases`、`learning`、`topics` 数组长度填充三个计数，输出 `dist/assets/reference-share-card.png`（1200×630）。SVG 模板和 JSON 都参与图片缓存指纹；构建报告使用独立的 `referenceShareCard` 字段，原主页 `shareCard` 与其基线含义不变。修改参考库数据后运行 `npm run build`，使页面、分享图和项目模板同步；单独运行 `npm run build:references` 不会重绘 PNG。分享元数据和结构化数据仍在 `scripts/build-references.mjs` 中维护。

`dist/404.html` 提供静态返回入口，不自动重定向未知地址。`dist/references/index.html` 是 `/references/` 兼容入口，脚本可用时跳转到规范地址 `/references.html` 并保留查询参数及锚点，无脚本时保留手动链接。两页直接维护，当前不由参考页生成器覆盖。回归包含 `/references/?topic=knowledge#cases`、无脚本入口及未命中地址；Python 本地服务器可直接预览 `/404.html` 的版式，但真正的 404 路由和 `/references` 到目录入口的行为应在部署后核验。若迁移到域名子路径，需同步调整这两页使用的根路径链接。

## 部署

GitHub Pages 使用 GitHub Actions 发布已提交的 `dist/`。提交前执行构建并一并提交生成文件；推送 main 后自动部署。运行时不依赖 ChatGPT、外部 CDN、数据库或登录。

全部图片、字体退路、样式与脚本随站点提供。若更换域名，统一更新页面 canonical、分享地址、结构化数据、sitemap、VCF、参考模板及笔记回链。`references.html` 使用明确文件名以兼容静态托管。

GitHub Pages 的各地区网络可达性取决于访问者的网络环境。源码可部署到其他静态主机或自有域名。

## 归属

个人简介、品牌及素材属于各自权利人；外部案例仅保留本站摘要和来源链接。第三方图标与搜索组件许可证见 `dist/third-party-notices.txt` 和 `dist/assets/` 中许可证文件。
