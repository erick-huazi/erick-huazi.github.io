# v41 动效项目评分与接入记录

2026-10-28 按本站现状作主观评估：视觉表现40分、本站适配30分、接入便利20分、许可清晰度10分；不是 GitHub 官方评分或性能基准。评价基于仓库说明与演示入口，并非对所有项目做完整设备实测。

| 候选 | 分数 | 判断 |
| --- | --- | --- |
| [RotatingOnScrollAnimations](https://github.com/codrops/RotatingOnScrollAnimations) | 91 | 3D滚动编排适合作品实屏；本轮选其滚动旋转与纵深机制，保持原生内容。 |
| [On-Scroll Image Distortion and Grain](https://github.com/jankohlbach/codrops-shader-on-scroll) | 90 | 画面变形与颗粒有视觉冲击；需另做 WebGL与图片兼容，留作参考。 |
| [3DCarousel](https://github.com/codrops/3DCarousel) | 87 | 立体轮播有表现力；本站现有作品目录和无障碍/深链接需保留，暂不整体替换。 |

## 实际接入

选用 [Codrops RotatingOnScrollAnimations 的 js/index.js](https://github.com/codrops/RotatingOnScrollAnimations/blob/6c6ea42d3f4f3d122240ec931871afcac80b388e/js/index.js)，适配其对称三轴旋转和 `sin(progress * π) * -50` 纵深表达。使用本站已有原生 JavaScript、CSS 与滚动监听；没有引入上游图片、字体、Lenis 或新运行时依赖。动作只作用现有 `.case-artwork` 图片层，不改变作品条目布局、文字和原生链接。

上游项目 [MIT 许可证原文](../dist/assets/vendor/codrops-rotating/LICENSE.txt)及版权通知保留，另见 `dist/third-party-notices.txt`。上游和其他项目的演示图片、依赖授权需分别核验；评分不表示其作者或示例属于本人作品。

滚动更新仅覆盖近视口内容；暂停、系统减少动态效果、移动端、键盘焦点和打开对话框时返回稳定展示。验收及发布状态以实际浏览器回放、对应 GitHub Actions 与公开文件核对为准。
