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
- `dist/reference-compare.*`：双案例对照与本地笔记下载。
- `dist/index.html`、`main.js`、各样式源文件：个人主页。
- `scripts/build-assets.mjs`：生成 `site.css` 与优化图片，避免直接编辑生成文件。

## 部署

GitHub Pages 使用 GitHub Actions 发布已提交的 `dist/`。提交前执行构建并一并提交生成文件；推送 main 后自动部署。运行时不依赖 ChatGPT、外部 CDN、数据库或登录。

全部图片、字体退路、样式与脚本随站点提供。若更换域名，统一更新页面 canonical、分享地址、结构化数据、sitemap、VCF、参考模板及笔记回链。`references.html` 使用明确文件名以兼容静态托管。

GitHub Pages 的各地区网络可达性取决于访问者的网络环境。源码可部署到其他静态主机或自有域名。

## 归属

个人简介、品牌及素材属于各自权利人；外部案例仅保留本站摘要和来源链接。第三方图标与搜索组件许可证见 `dist/third-party-notices.txt` 和 `dist/assets/` 中许可证文件。
