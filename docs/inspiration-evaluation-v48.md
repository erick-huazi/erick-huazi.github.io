# 灵感筛选与落地记录 · v48

评分是针对本站的主观选择，不是平台官方排名。维度：FDE 契合 30、访客理解 25、静态站适配 25、视觉启发 20。

| 来源 | 评分 | 判断与采用方式 |
| --- | ---: | --- |
| [Codrops：菜单项目图片显现](https://tympanus.net/codrops/2020/07/01/creating-a-menu-image-animation-on-hover/) | 88（27+23+23+15） | 借鉴目录与画面联动的交互概念；使用本站已有图片，不复制原素材或代码。 |
| [Awwwards：作品集分类](https://www.awwwards.com/websites/portfolio/) | 84（25+21+22+16） | 参考作品集的层级和留白；分类页本次不可用，仅依据官网分类入口，不评价具体作品。 |
| [MotionSites：Viktor Portfolio](https://motionsites.org/prompts/viktor-portfolio) | 83（25+20+20+18） | 从公开预览参考分区层级，不使用受限提示词或背景视频。 |
| [GitHub：Cindy](https://github.com/makecindy/cindy) | 85（27+21+21+16） | 参考围绕具体任务组织 Agent 信息，不在本站接入或宣称使用。 |
| [Product Hunt：withHuman](https://www.producthunt.com/products/withhuman) | 88（28+23+23+14） | 借鉴人工复核的重要性；本站已有流程示意，不增加重复内容或宣称有审核系统。 |

## 此次执行

在首页作品目录配套的画框中，桌面悬停或键盘聚焦时展示相应本地预览；项目实屏保留采集日期，Astrrot 标记为主题示意。小屏沿用原有作品入口，信息不依赖悬停。动画关闭或系统减少动态效果时即时切换；不支持 `:has` 的浏览器保留原画框。鼠标与键盘同时作用于不同项目时，焦点项目优先。未引入第三方库或其图像。
