# 设计与产品参考评估 · v43

日期：2026-10-28。以下是针对本个人主页的主观选型评分，不是来源平台的官方评分，也不是性能或产品效果的测试结果。维度依次为：身份与内容契合 30、视觉/叙事启发 25、现有静态站可实现性 25、可读性与维护 20。

| 参考 | 契合 | 启发 | 实现 | 维护 | 总分 | 本轮取舍 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| [Awwwards Portfolio](https://www.awwwards.com/websites/portfolio/) | 28 | 24 | 22 | 17 | 91 | 借鉴作品信息层级；保留原有东方视觉，不复制案例图片或文案 |
| [MotionSites 动效目录](https://motionsites.org/motion) | 26 | 22 | 21 | 18 | 87 | 借鉴滚动驱动的阅读节奏；自写轻量路径线动效 |
| [Codrops 3D Scroll-Driven Text](https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/) | 24 | 20 | 23 | 18 | 85 | 参考滚动与空间动效思路；本轮不复制其 3D 文字代码，也不增加 ScrollSmoother，保留 v41 已接入的作品图动效 |
| [Impeccable](https://github.com/pbakaus/impeccable) | 28 | 17 | 22 | 19 | 86 | 参考审视重复模板与排版层级的思路；未安装或运行其技能/脚本 |
| [Mastra on Product Hunt](https://www.producthunt.com/products/mastra) | 27 | 19 | 22 | 18 | 86 | 参考产品页面围绕具体用途解释能力；不将该产品或其成果归为本人经历 |

## 实际落地

首页四个作品增加由已展示内容归纳的三项产品体验；仍保留原有角色标注、事实说明、详情和外链。新的路径线在支持 CSS view timeline 的桌面浏览器中按滚动渐显；无此能力、手机、关闭动态效果或系统要求减少动效时，信息及完整线条静态可见。无新增运行时依赖或第三方图片、代码。此前的 Three.js、GSAP 和 Codrops v41 许可与来源记录仍适用，参见 [v41 来源](open-source-motion-v41.md)。
