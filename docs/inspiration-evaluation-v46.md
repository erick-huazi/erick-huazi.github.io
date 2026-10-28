# 设计与产品参考评估 · v46

日期：2026-10-28。分数为针对本个人主页的主观选型判断，不是平台官方评分或性能测量。统一维度：身份适配 30、信息与视觉启发 25、静态站可实现性 25、阅读和维护 20。

| 来源与具体参考 | 适配 | 启发 | 落地 | 阅读维护 | 总分 | 本轮采用 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| [MotionSites：Feature Work Benjamen](https://motionsites.org/prompts/feature-work-benjamen) | 27 | 23 | 22 | 18 | 90 | 参考作品层级和细节反馈，不复制站点素材、提示词或代码 |
| [Awwwards：Viens-Là 作品集解析](https://assets.awwwards.com/assets/files/live-presentation.pdf) | 25 | 22 | 21 | 19 | 87 | 参考章节式排版与移动端阅读，不复制品牌或图文 |
| [Codrops：滚动 SVG 地图](https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/) | 24 | 23 | 19 | 17 | 83 | 借鉴滚动和叙事的关系，自写 CSS 装饰动效；不接入教程地图、插件或代码 |
| [GitHub Trending：Hallmark](https://github.com/Nutlope/hallmark) | 28 | 19 | 24 | 18 | 89 | 参考真实内容、层级和可访问性检查，不安装或执行该工具 |
| [Product Hunt：Sim](https://www.producthunt.com/products/sim-studio) | 27 | 22 | 22 | 17 | 88 | 参考可视化工作流表达，以“流程示意”标识静态示例，不接入其产品或声称为本人作品 |

## 实际实施与边界

“合作路径”使用本地 CSS 实现深绿、暖金的章节面板；桌面支持 view timeline 时，装饰轨迹随浏览位置轻微移动。关闭动态、系统减少动效、手机和不支持的浏览器使用完整静态样式。现有四步文案与原3D首屏不变。自动化服务增加选题、资料整理、内容初稿、人工审核四个步骤，沿用原有场景描述，明确是静态示意，不代表实际运行或已交付案例。手机作品截图来源标签增大，入口目标至少44px。不新增运行依赖或复制第三方素材。
