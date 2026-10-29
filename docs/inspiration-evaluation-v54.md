# 实屏画廊优化参考 · v54

2026-10-29；评分为针对本站的主观选择，按 FDE 契合 30、访客价值 25、静态站适配 25、视觉启发 20 计，不是平台官方评分。

| 来源 | 分数 | 应用及取舍 |
| --- | ---: | --- |
| [Codrops：响应式缩略图画廊](https://tympanus.net/codrops/2011/09/20/responsive-image-gallery/) | 88（27+23+23+15） | 参考缩略图与大图关联、前后切换；未复制旧版 jQuery 代码或素材。 |
| [Awwwards 收录作品：G. Colombel](https://guillaumecolombel.fr/) | 87（27+21+23+16） | 参考作品按编号组织和清晰身份；不复制作者资源。 |
| [MotionSites：Finance Assistant 公开预览](https://motionsites.org/zh/prompts/finance-assistant) | 84（26+21+21+16） | 参考页面信息与视觉的关联；未使用受限提示词或素材。 |
| [GitHub：DeepTutor](https://github.com/HKUDS/DeepTutor) | 87（27+23+23+14） | 参考围绕用户任务组织信息，不接入其工具，不当作本人作品。 |
| [Product Hunt：Sim](https://www.producthunt.com/products/sim-studio) | 85（27+23+21+14） | 参考工作流的可理解性；保留已有自动化示意，不增加重复图。 |

## 执行

实屏新增 JMSAI 后已有四项，画廊不再固定三列：桌面自适应列数，手机缩略图可水平滚动；前后切换和直接打开项目时会把当前缩略图移入可见区域。保留按钮、原图入口、键盘与焦点、无脚本原图链接和既有动效开关。没有引入第三方代码或依赖。JMSAI 截图中的市场数据为采集时刻画面，不是实时行情。
