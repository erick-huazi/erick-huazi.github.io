# v39 纸间行旅

本轮以原创纸页、金色框线和朱砂、孔雀绿、金色三条飘带构成空间场景。镜头沿纵深推进，纸页打开、飘带轻转，页面以“构想、打磨、落地”三个阶段表达从问题到产品的过程。文字和作品入口仍在普通 HTML 中，画布只承担装饰表现，不接管整页滚动或承载业务内容。

几何与材质由 `src/spatial-intro.mjs` 生成，没有引入外部人物模型、纹理或场景资产；静态退路继续使用本站既有的原创飘带插画。

## 运行与维护位置

| 文件 | 职责 |
| --- | --- |
| `src/spatial-intro.mjs` | Three.js 场景、相机、纸页/飘带、GSAP 时间线及资源清理 |
| `dist/motion.js` | 条件加载桥接、动效状态、深链接与异步有效性检查 |
| `dist/index.html` | 静态文案、三个阶段、插画和原生跳过链接 |
| `dist/mineral-editorial.css` | 既有第20层样式内的场景、静态退路与断点 |
| `scripts/build-assets.mjs` | 生成场景副本、压缩 vendor ESM、复制法律声明并报告哈希/字节 |
| `src/retired-style-symbols.json` | 将发布脚本映射到真实本地源码和依赖源，继续执行来源守卫 |

修改场景源文件后运行 `npm run build`，不要直接改 `dist/assets/spatial-intro.mjs` 或压缩后的 vendor 文件。构建缓存包含输入哈希、工具版本及变换选项，命中时仍核对输出 SHA-256。

## 固定依赖与自托管文件

Three.js 固定为 **0.186.1**，GSAP 固定为 **3.15.0**，构建工具 esbuild 固定为 **0.28.2**；精确依赖由 `package-lock.json` 记录。发布文件均为本地路径：

| 发布文件（相对 `dist/assets/`） | 来源与关系 |
| --- | --- |
| `spatial-intro.mjs` | 原样复制 `src/spatial-intro.mjs` |
| `vendor/three-0.186.1/three.module.js` | 官方 ESM，静态引用同目录 `three.core.js` |
| `vendor/three-0.186.1/three.core.js` | 官方 ESM 核心 |
| `vendor/gsap-3.15.0/gsap-core.js` | GSAP 核心数值动画 |
| `vendor/gsap-3.15.0/CSSPlugin.js` | 静态引用 `gsap-core.js`，提供 ScrollTrigger 所需 DOM 工具 |
| `vendor/gsap-3.15.0/ScrollTrigger.js` | 静态引用 `Observer.js`，关联原生滚动进度与相机时间线 |
| `vendor/gsap-3.15.0/Observer.js` | ScrollTrigger 的 ESM 依赖 |

六份 vendor 脚本分别使用 `esbuild.transform` 压缩为 ESM，设置 `legalComments: 'inline'`，不打包、不重写相对文件名。场景依次导入 GSAP core、CSSPlugin、ScrollTrigger，并显式注册两个插件。即使镜头只动画数值，也不能裁掉当前 ScrollTrigger 实际需要的 CSSPlugin。没有使用 `index.js`，也不把浏览器全局 UMD 文件直接当作 ESM 导入。

来源守卫检查未压缩的真实源文件，包括 CSSPlugin 和 Observer；未知计算式导入、外部脚本或退役类复用仍导致失败，没有为 vendor 增加跳过规则。`build-report.json` 的 `spatialRuntime` 记录实际生成或缓存验证后的文件字节、本地 gzip 与 SHA-256；这些是文件指标，不是下载速度、帧率、LCP 或其他浏览器性能实测。

## 条件加载与静态退路

以下描述当前代码规则，不代表各环境均已完成浏览器验收：

- 只有宽度至少1001px、高度至少600px，且支持悬停和精细指针的窗口才进入 3D 加载条件。
- 场景须进入视口并位于可安全增强的入口位置；系统未请求减少动态效果、站内动效未关闭、页面可见且没有打开的 dialog，才允许初始化。浏览器提供 `saveData` 且已开启时也不初始化。
- 首次访问作品等其他深链接时，不为上方场景下载依赖或改变目标位置；“直接看作品”仍是原生锚点链接。返回场景后可重新参与条件判断。
- 每个异步加载阶段重新检查有效性，暂停、跳过或离开后迟到的初始化不能安装新画布。已经开始的模块下载本身不保证能取消。
- 关闭动效、切换系统偏好、打开弹窗或页面不可见时停用场景与滚动触发器。退出页面时按生命周期释放几何、材质、时间线、观察器与 WebGL 资源。
- 手机、小窗口、系统减少动态效果、无 JavaScript、缺少所需浏览器能力或加载/WebGL 失败时，保留静态插画、完整文案与作品链接。已加载场景在条件失效时停止增强，不要求访客先观看动画才能查看作品。

WebGL 渲染区不承载可访问名称或可点击业务操作；阶段列表在 HTML 中维护当前步骤。页面继续使用现有动效开关、导航和作品目录。

## 来源与许可边界

动效研究参考了 [Purple Noggin](https://purplenoggin.com/) 的空间叙事方向。其关联公开仓库是 [sunyuchenyaobo/purple-geo](https://github.com/sunyuchenyaobo/purple-geo)，但核查的 [公开提交](https://github.com/sunyuchenyaobo/purple-geo/commit/298e04707e548276ad43e1896e52aa68014700c2) 不包含线上 `FreefallScene` 的当前实现，且未找到该作者场景的复制许可。本站没有复制其自定义代码、品牌、角色、模型或纹理，不把相关公开仓库描述为已获授权的动效模板。

[Three.js](https://github.com/mrdoob/three.js) 为 MIT，完整原始许可证随 `dist/assets/vendor/three-0.186.1/LICENSE.txt` 分发。[GSAP](https://github.com/greensock/GSAP) 使用 [Standard No Charge License](https://gsap.com/community/standard-license/)，**不是 MIT**。原始合法声明块保留在压缩产物中，GSAP 上游 README 原样分发，版本及原创性说明见 `dist/assets/vendor/gsap-3.15.0/NOTICE.txt`，其源文件为 `src/spatial-vendor-notice.txt`。

esbuild 只作开发构建工具，不作为网页运行依赖。没有引入 React、React Three Fiber、Drei 或 r3f-scroll-rig，也不使用场景 CDN。第三方许可不自动覆盖参考站作者的自定义代码与素材。

## 当前验证边界

已执行本轮资源构建并得到成功退出状态；生成文件的相对导入、合法声明保留及来源追踪已核对。以下为主任务提供的本轮浏览器回放与独立复核结果，尚未发布。

| 场景 | 已确认结果 |
| --- | --- |
| 真实 WebGL 与滚动阶段 | ready 状态存在1个画布，滚动可见“构想、打磨、落地”三个阶段 |
| 站内暂停 | 观察区间内渲染计数132→132 |
| dialog 打开 | 观察区间内渲染计数8→8 |
| 跳过并离屏 | 观察区间内渲染计数143→143 |
| 首次深链接 | 场景请求计数0、画布0，目标区顶部约106px |
| 响应式与短屏 | 宽320、390、760、1000、1001、1279、1280、1440px，以及宽844px短屏，未发现横向或标题溢出；1001px再次回放确认 ready、单画布 |
| 上下文丢失退路 | 在真实 WebGL 上下文调用 `WEBGL_lose_context` 扩展后，画布1→0，场景高度1224→587px，`spatial-enhanced` 被移除 |
| 减少动态与省流 | JavaScript 模拟 reduce 偏好及省流设置时，场景请求计数均为0；这不是操作系统偏好或真实网络省流环境实测 |
| 3000ms 延迟期间原生导航 | 保持 static、画布0，`workTop` 约103.8px；返回场景后请求计数2、ready、单画布 |
| 桌面最终 axe | 同版本复测0条自动违规，仍有2项需人工判断；未发现 warn/error |
| 既有操作回归 | 搜索、画廊、归档与历史的基本操作回放通过 |
| 异步与原生导航代码复核 | 新增 `requestEntryCheck` 与 `observedHash` 修复已通过独立 review |

这里的“场景请求计数”是页面记录的初始化尝试次数，不是网络资源请求总数；渲染计数在观察区间不增加，也不是 FPS 或长期性能达标证明。3000ms 为人为延迟场景，不等于真实慢网络测量。

手机首次 axe 在文字入场 opacity 从0到1的瞬间读到1.74的颜色对比度。主任务已把 v39 文字入场首帧 opacity 固定为1，仅保留16px位移，image/surface 入场未改。后一次检查仍命中旧缓存，因此动效脚本缓存参数升级为39.1；最终 DOM 已确认首帧 opacity 为1，手机 axe 复测0条自动违规，仍有2项需人工判断。修复前 JSON 保留于主工作区 `outputs/`，未以最终通过结果覆盖。

尚未发布，不能据本记录声明已部署。未实测 Core Web Vitals、FPS、操作系统减少动态效果或完整读屏流程；自动检查、局部回放和模拟结果不能替代这些项目。最终验收与部署状态以本轮实际证据和精确提交的发布记录为准。
