# 设计与产品参考评估 · v47

日期：2026-10-28。以下是针对本个人主页的主观选型分，不是平台官方排名，也不代表性能测试或真实业务结果。统一维度：FDE 身份契合30、访客理解25、静态站可实现性25、阅读维护20。

| 来源 | 契合 | 理解 | 实现 | 阅读维护 | 总分 | 参考与实际使用 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| [Codrops：Corentin Bernadou 的作品集](https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/) | 28 | 22 | 22 | 17 | 89 | 参考编辑式层级、清晰界面与适度动效；保留现有视觉，不复制代码素材 |
| [MotionSites：Vexel SaaS](https://motionsites.org/prompts/vexel) | 26 | 22 | 19 | 18 | 85 | 参考标题后明确的行动入口和细微箭头反馈；未复制付费提示词或视频 |
| [Awwwards 移动端体验指南](https://www.awwwards.com/mobile-excellence-guidelines.pdf) | 27 | 19 | 22 | 19 | 87 | 根据公开检索摘要参考触摸目标与可读性；PDF本轮直接读取超时，未逐条审阅 |
| [GitHub：AI Design Skills](https://github.com/elayadesign/ai-design-skills) | 25 | 20 | 24 | 17 | 86 | 参考响应式与信息层级检查，不安装、不运行技能 |
| [Product Hunt：Heym](https://www.producthunt.com/products/heym) | 28 | 23 | 23 | 15 | 89 | 参考人工审批与可检查流程的表达；本站不接入该服务，也不将其归为本人案例 |

## 实际落地

在既有合作四步后增加微信联系和作品入口，样式使用现有暖金/深绿；指针悬停时箭头短暂位移，尊重动效关闭和系统减少动态偏好。微信按钮保留 `#contact` 的原生无脚本退路，支持现有二维码弹窗及关闭返焦。修复需求工具同一锚点重复点击时无法重新展开的问题：常规点击先打开已存在的 details，原有输入及模板逻辑不变，不自动发送。没有新增运行依赖，也没有复制第三方代码或视觉资产。
