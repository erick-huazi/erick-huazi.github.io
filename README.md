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
- `dist/reference-teaser.css`：主页参考库入口样式，单独打包，避免主页加载整页参考库样式。
- `dist/reference-compare.*`：双案例对照与本地笔记下载。
- `dist/index.html`、`main.js`：个人主页及业务交互。
- `dist/editorial.css`、`editorial-motion.css`、`motion.js`：v21 个人作品集排版与可关闭动效。
- `dist/reference-editorial.css`：参考库的目录式阅读布局。
- `dist/reference-reading.css`、`reference-reading.js`：v23 章节导航、阅读位置与案例定位入口。
- `dist/navigation-editorial.css`、`contact-editorial.css`：v22 手机导航、搜索与联系区域。
- `dist/project-viewer.css`、`main.js` 中作品查看器：站内实屏放大，原始图片链接作为无脚本退路。
- `scripts/build-assets.mjs`：生成 `site.css` 与优化图片，避免直接编辑生成文件。

v21 首屏展示真实作品界面，使用 700/1400 两档 WebP；旧抽象圆环资源保留归档，主页不再加载。分享卡使用同一姓名排版。动画尊重系统“减少动态效果”和站内暂停设置；关闭后文字、链接和项目保持可见。修改快速导航后，检查键盘选中项始终可见、关闭重开回到首项，以及跨页入口是否正确。参考库筛选会清除当前结果链接的旧锚点；需回归浏览器前进/后退的位置恢复、带筛选参数的首次访问和案例深链接。

作品查看器修改后，检查打开/关闭、Esc、遮罩、返回焦点和窄屏滚动；Ctrl/Meta/Shift 点击必须继续使用原始链接。联系区改动需检查填写需求、生成内容、手机输入框及完整联系方式。

参考库章节导航保留原生锚点，无脚本时也可使用。修改后检查 320px 小屏、页头换行、筛选和详情展开后的当前章节；直达案例的标题不应被固定导航遮挡。案例链接指向已有稳定 ID，来源核验日期只在重新核验资料后更新。

## 部署

GitHub Pages 使用 GitHub Actions 发布已提交的 `dist/`。提交前执行构建并一并提交生成文件；推送 main 后自动部署。运行时不依赖 ChatGPT、外部 CDN、数据库或登录。

全部图片、字体退路、样式与脚本随站点提供。若更换域名，统一更新页面 canonical、分享地址、结构化数据、sitemap、VCF、参考模板及笔记回链。`references.html` 使用明确文件名以兼容静态托管。

GitHub Pages 的各地区网络可达性取决于访问者的网络环境。源码可部署到其他静态主机或自有域名。

## 归属

个人简介、品牌及素材属于各自权利人；外部案例仅保留本站摘要和来源链接。第三方图标与搜索组件许可证见 `dist/third-party-notices.txt` 和 `dist/assets/` 中许可证文件。
