# v71 设计选型记录（2026-11-11）

目标：去掉 v70 仍然存在的“AI 模板感”，找 GitHub 上真正有设计质量的项目和组件作依据。

评分是针对本站（中文个人作品集、纯静态、无框架）的适配度，不是对项目本身的评价，也不是 GitHub 星数排名。星数为 2026-11-11 通过 GitHub API 查询。

## v70 被判定为“模板感”的元素

近黑底配单一霓虹色、等宽大写小标签（`01 / SELECTED WORK`）、描边空心大字、跑马灯、字符乱码动效、经纬度装饰、跟随光标的圆点、每个区块都是“编号 + 巨型标题 + 细线网格”。这些单独看都成立，叠在一起就是近两年生成式页面的通用长相。

## 候选与评分

| 项目 | 星数 | 许可 | 适配分 | 结论 |
|---|---|---|---|---|
| [atelier-anchor/smiley-sans](https://github.com/atelier-anchor/smiley-sans) 得意黑 | 14,965 | OFL-1.1 | 94 | **采用**。有明确设计师意图的中文标题字体，一换即脱离系统黑体的默认感；子集化后约 50 KB。 |
| [rough-stuff/rough-notation](https://github.com/rough-stuff/rough-notation) | 9,742 | MIT | 90 | **采用**。手绘划线/高亮，带不规则笔触，是“人手”最直接的信号；约 4 KB（gzip），按需加载。 |
| [lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai) 霞鹜文楷 | 26,947 | OFL-1.1 | 78 | 未采用。气质偏文艺，和“工程交付”定位不合；字体体积大。 |
| [TrionesType/zhuque](https://github.com/TrionesType/zhuque) 朱雀仿宋 | 3,616 | OFL-1.1 | 74 | 未采用。很美，但会回到最初“米色 + 衬线”的方向。 |
| [github/mona-sans](https://github.com/github/mona-sans) | 4,193 | OFL-1.1 | 70 | 未采用。拉丁字体，现有 Archivo 已够用。 |
| [githubnext/monaspace](https://github.com/githubnext/monaspace) | 19,819 | OFL-1.1 | 40 | 未采用。等宽字体正是要去掉的元素。 |
| [Innei/Shiro](https://github.com/Innei/Shiro) | 4,247 | 自定义 | 82（参考） | 只参考气质：纸面感、留白、克制。未使用代码。 |
| [antfu/antfu.me](https://github.com/antfu/antfu.me) | 1,093 | MIT | 80（参考） | 只参考：内容优先、个人痕迹明显。未使用代码。 |
| [pacocoursey/paco](https://github.com/pacocoursey/paco) | 317 | 无 | 76（参考） | 只参考：细节克制。无许可证，不能取用代码。 |
| [emilkowalski/sonner](https://github.com/emilkowalski/sonner) | 13,189 | MIT | 72（参考） | 只参考动效时长与缓动的分寸；本身是 React 组件，不适用。 |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 127,877 | MIT | 45 | 未采用。React 生态，且默认外观本身就是“AI 生成页面”的常见底色。 |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 23,197 | MIT | 30 | 未采用。跑马灯、光晕、渐变边框等正是模板感来源。 |
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | 51,679 | 自定义 | 30 | 未采用。同上，特效堆叠。 |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | 17,186 | MIT | 50 | 未采用。平滑滚动会接管原生滚动，和现有锚点、阅读位置逻辑冲突。 |

## 采用的方向：「校样 / Proof」

- 纸、墨、一支荧光笔：浅色纸面、墨色文字，唯一的颜色是荧光黄，只做两件事——划重点，和整块铺底。
- 标题全部用得意黑；正文仍用系统字体，保证加载快。
- 重点词用手绘高亮和划线标出，像在校样上做批注。
- 首屏放真实作品截图，不放生成图、不放装饰图形。
- 去掉：跑马灯、描边字、编号英文小标签、乱码动效、经纬度、跟随圆点、滚动进度条。
