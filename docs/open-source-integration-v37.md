# GitHub 项目、Skill 与 Agent 实践评估 · v37

核验日期：2026-10-28（Asia/Shanghai）。以下是针对当前静态作品集的主观适配评分，不是官方评分、星数排名或安全认证。相关性30、工程质量25、维护20、集成成本25；成本分越高代表本项目采用方案越轻。没有运行候选框架的性能基准。

| 候选与官方来源 | 相关 | 质量 | 维护 | 成本 | 总分 | 本轮处理 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) | 29 | 23 | 19 | 25 | 96 | 用于交互、键盘、动效与反馈检查 |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | 29 | 23 | 18 | 25 | 95 | 借鉴主题、字体层级、真实内容与界面复核方法 |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | 27 | 23 | 19 | 20 | 89 | 采纳可复现验收与独立检查流程 |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | 29 | 24 | 13 | 20 | 86 | 借鉴通用画廊、图片元数据与键盘浏览方式 |
| [Motion](https://github.com/motiondivision/motion) | 20 | 24 | 20 | 19 | 83 | 借鉴短过渡与可关闭的动画生命周期 |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 20 | 24 | 19 | 12 | 75 | 保留状态恢复方法参考，不接入本站运行时 |
| [Lenis](https://github.com/darkroomengineering/lenis) | 14 | 22 | 19 | 13 | 68 | 本轮不采用，保留原生滚动 |
| [AutoGen](https://github.com/microsoft/autogen) | 16 | 22 | 2 | 9 | 49 | 不作为新依赖；README 宣告停止维护，API archived 标志仍为 false |

完整的官方文档、精确提交或版本、许可范围和未知项见 [项目与 Skill 研究](github-candidates-v37.json) 及 [Agent 研究](agent-practices-v37.json)。维护分依据本次读到的公开记录，不等同于长期维护承诺。Spec Kit 成本分对应轻量方法融合；Agent 运行时成本分对应实际运行时接入，两者采用范围不同。

## 落实到网站的改进

原查看器仅支持世界杯，标题、图片和日期均写死；HYALORIA 两张图会打开新窗口。现已统一为三张真实实屏的站内画廊。配置从各自作品卡片读取，切图同步标题、alt、日期、原图、项目链接及登录说明。Astrrot 仍为已标注的主题插画，未冒充实屏加入画廊。

画廊使用暖纸面、深绿衬底、细边线和缩略目录，与既有矿物色主题一致；提供前后切换、左右键、原尺寸/适应窗口与原图入口。原尺寸依据实际文件像素，不沿用固定1400px。图片加载与失败有反馈，快速切图使用请求序号与独立图片节点，关闭会作废回调并返还焦点。

入场过渡为0.28秒，遵循原动效开关与系统减少动态效果。真实图片始终保留原生链接；脚本缺失、dialog不支持或修饰键点击时可继续访问。没有新增候选项目的运行时依赖，也未复制外部 Skill 的安装脚本或覆盖项目规则。

本轮实际采用设计研究、实现、独立复核三个职责，并按 [项目验证流程](quality-workflow.md) 回放原场景。Tab首尾回放曾发现焦点离开页面，补上边界循环后已重演通过；保留首次问题记录和修复验证，不以“已有测试通过”代替重现。

## 许可与事实边界

这里只记录方法借鉴与本项目自己的实现，没有将未安装的库写成已接入。frontend-design 子目录许可为 Apache-2.0；Vercel 规则源为 MIT，其 agent-skills 整库许可本次未查到，不笼统标成 MIT。AutoGen 维护声明与仓库 archived 标志分别记录。具体许可证链接与范围保留在两份研究 JSON 中。

原项目职责、HYALORIA 产品关系、个人资料和参考库事实不因技术研究改变。外部开源项目不构成本人的客户经历或合作背书。验证结果和发布证据保留在任务工作区；尚未执行的项目按未知记录。
