# GreenPoint 评委 Demo / Evidence → Review → Muse → MCP

Updated 2026-11-03. Real-run rehearsal baseline: release `ea31476`; this update adds the atlas alignment correction and judge script.

主线：一个植物候选有原始图像、模型建议和独立的人工决定；同一感知接口也能为上层 Agent 提供证据。口号：**A source for every judgment. A person for every decision.**

以下按三分钟英文主讲、中文操作提示准备，并附九十秒版；提交材料暂按公开仓库准备，实际可见性和赛事要求应在提交前核对。比赛名称、正式限时和提交规范尚未提供；180 秒与 90 秒是排练目标，不是已确认的比赛要求。没有自动提交参赛材料或录制演讲视频。

## Field atlas 的定位与边界

2026-11-03 复查发现 Landing 的 **Field atlas** 原示意坐标未与底图逐株校准；这不是模型检测偏移。本轮已对照 1586×992 原图裁切，重新把 Crop、Weed 和两个 Needs review 标记放在绿色、珊瑚色和黄色示例植株中心，并减轻标记底色。手机端标签与引线也已调整。

这些仍是人工布置的概念标记，颜色不构成植物类别的真实标注。对评委说明 Field atlas 是概念布局；真实分析证据来自 **Real evidence** 和 **Recorded real Meta run**。不要把示意点位作为实际检测、GPS 或整田覆盖率证据。底图更换后必须重新核对落点。

## 预开三个标签页

| 标签 | 页面 | 起始状态 |
| --- | --- | --- |
| A | [Landing](https://greenpoint-vert.vercel.app/) | Hero；已检查 Real evidence 和 Agents & MCP 数据加载完成 |
| B | [审核工作区](https://greenpoint-vert.vercel.app/dashboard) | Evidence source 为 Recorded · Sugar beet / Weed review example；GP-001；Model: weed · Human pending |
| C | [公开验证报告](https://greenpoint-vert.vercel.app/validation.html) | 已加载，准备指向 3 / 88 和 target not met |

使用演示专用窗口，建议桌面内容区 1280×720 或 1440×900；提前确认投屏文字可读。主流程不需要输入或展示任何 token。

B 的真实记录审核决定保存在当前标签页内存中。开始排练前用全新的 B 标签页恢复 pending；修改后不要刷新或跳回 Landing。A 是原始模型记录的固定预览，不继承 B 的人工决定。MCP 也不读取 B 的浏览器内存决定。跨标签页切换是演示操作，不是跨标签同步功能。

## 先分清四种证据

| 内容 | 演示类型 | 能证明什么 |
| --- | --- | --- |
| Real evidence / 默认工作区来源帧 | 真实 Meta 输出的录制回放 | 原图、候选框、裁切、模型建议的对应关系；不证明真实农户表现或视频追踪准确率 |
| Run MCP test | 现场网络请求 | MCP 初始化、工具发现、公开能力与示例读取可用；12 条记录是 illustrative sample，不是这次识别出的植物 |
| Landing 的 Muse → MCP 三步 | 另一笔真实 Meta 请求的录制回放 | Muse 实际发起能力发现和受保护的单帧分析，随后产生受约束的最终决定 |
| Validation report | 已完成的冻结公开数据检查 | 20 张验证图的结果、漏检和限制；不是正式 PhenoBench 排行榜结果 |

Muse 展示有 **两个 MCP 工具调用 + 一个最终模型回答**。不要说成三个工具调用，也不要把点击步骤按钮称为新推理。

## 三分钟逐步口播

英文主稿约 261 词。按每分钟 120–140 词估算，纯口播约 112–131 秒，余量用于点击、切页和停顿；这个估计不代替真人计时排练。

### 0–15s — A / 农户问题

**操作：** 停在首页 Hero，光标保持安静。

> A farmer reviewing field footage needs a clear next step: which plant deserves attention, with the source evidence close at hand.

### 15–45s — A / 真实证据

**操作：** 点击 Real evidence。先展示 GP-001，再点 GP-004 Needs review；指出左侧框、右侧裁切和说明一起变化。

> GreenPoint keeps each plant suggestion connected to its source. This is a recorded Meta run on a selected public PhenoBench sugar-beet image. SAM 3.1 found the candidate; Muse Spark suggested its label. Selecting another candidate updates the source box, crop and explanation together. The coordinates belong to this image.

### 45–75s — B / 人工决定

**操作：** 切到预开的 Dashboard。选 GP-001 → Keep for review → Save & next → 再点 GP-001。指向 Model: weed · Human deferred。

> The model suggests weed. I can keep this plant for review while preserving the original suggestion. Here, the model still says weed and my decision is deferred. Uncertainty stays visible, and the source evidence stays attached.

### 75–95s — B / 实时 MCP 连通性

**操作：** 左侧 Agents → Robots & agents → Run MCP test。指出 3 tools discovered · 12 sample plants returned；等待最多 8 秒，超时按备用话术切走。

> This connection check calls our public MCP tools now. The twelve sample records are illustrative; this verifies connectivity. Model-based frame perception is a separate tool with owner-managed access.

### 95–135s — A / Muse → MCP

**操作：** 切回 A，点 Agents & MCP，依次点 01、02、03。停在 human_review、GP-001 · GP-007、Treatment authorized: No。

> Here is a separate, recorded Muse run. Muse first discovers the interface, then requests analysis of one frame. GreenPoint returns seven candidates. Muse finishes with human review, the evidence IDs, and no treatment authorization. These are actual saved tool requests and responses. A physical drone or robot has not been connected.

### 135–160s — C / 验证结果

**操作：** 切到验证报告，指出 Annotated weeds found: 3 / 88 (3.4%)，以及 target not met。不要只指 3 / 3 (100%)。

> We publish the misses. On twenty frozen validation images, the pipeline found three of eighty-eight weeds. Its three weed predictions matched, a small sample. Weed recognition remains below target, and movement tracking is unvalidated. This is an assisted-review prototype.

### 160–180s — A / 收尾

**操作：** 切回 A 的 Muse 最终决定画面，停止操作，面向评委。

> Our working result connects Meta perception, source evidence, human judgment and agent access. Next we need stronger weed recall, validated tracking and farmer trials before field deployment. A source for every judgment; a person for every decision.

### 人工审核这一步的细节

- 默认 GP-001 的模型原始标签为 weed；选择 Keep for review 并保存后，显示 **Model: weed · Human deferred**。
- Save & next 会切到 GP-002，需要再选 GP-001 才能展示原始建议与人工决定。
- 延后不等于确认完成，所以仍可能显示 **0/7 reviewed**。这不是保存失败；它仍在待审核队列。
- 原始模型理由不会被人工决定改写。不要把新的 Needs review 状态解释为 Muse 又推理了一次。
- Landing 预览与 MCP trace 是不同的录制请求；GP-001 等 ID 只在各自来源范围内有效，不能据此声称跨请求追踪到了同一株植物。

## 九十秒压缩版

路线：A 的 Real evidence（约 0–30 秒）→ A 的 Agents & MCP 三步（约 30–65 秒）→ C 的 3/88（约 65–80 秒）→ 收尾。B 的保存操作和现场 MCP 连通性检查留作问答演示。

英文约 136 词；按每分钟 120–140 词估算，纯口播约 58–68 秒。

> GreenPoint gives every plant judgment a source. This is a recorded SAM 3.1 and Muse Spark run on a public PhenoBench sugar-beet image. Select a candidate and its source box, crop and explanation change together.

> The review workspace preserves the model’s original suggestion alongside a person’s decision, including deferring an uncertain case.

> Here is a separate, recorded Muse run through MCP. Muse discovers the interface, requests frame evidence and returns human review, with explicit evidence IDs and no treatment authorization. This demonstrates actual saved tool use. Physical devices have not been connected.

> We publish the limitations: the frozen twenty-image check found three of eighty-eight weeds. Recognition and moving-video tracking need more work.

> Today we have a working evidence-to-review loop and a generic interface for agents. Our next steps are better weed recall and real farmer trials.

## 现场失败时的转换话术

| 情况 | 下一步操作 | 直接说 |
| --- | --- | --- |
| MCP 检查 8 秒仍未完成，或返回错误 | 不反复重试；切 A 的录制 Muse 步骤，并展示 trace 链接 | “The live connection check is unavailable right now. Here is the published trace from a previous successful Muse run.” |
| 工作区或 Landing 记录加载失败 | 使用本轮保存的真实审核与 Muse 截图；有网络时打开原始 trace 或验证报告 | “I’m switching to a captured example of the same recorded run. This is backup evidence, not a new live inference.” |
| 现场临时要求上传视频 | 主流程先结束；问答阶段才使用已经预检的有界输入和授权访问 | “We can exercise the live path separately. The main demo uses published real runs so the evidence and limitations remain inspectable.” |
| 被问到 Field atlas 的点是否来自模型 | 返回真实来源帧，说明概念图与模型输出的区别 | “Those are manually placed concept annotations. Our model evidence is shown against the original source image here.” |

本轮已保存界面截图作为备用材料；完整的演示备份视频尚未录制。正式录制前完成两次真实计时口播，再录制一份完整备份。不要把静态图制作的视频当成真实移动视频，也不要把旧的连接检查截图称为现场请求。

## 高概率评委问答

| 问题 | 建议回答 |
| --- | --- |
| Why Meta? | “SAM 3.1 supplies candidate boxes and masks. Muse Spark supplies visual suggestions and also acts as the separate tool-calling agent. Both use Meta Model API.” |
| Is the main demo live? | “Plant analysis and the Muse trace are labeled replays of actual Meta runs. Human review is interactive now. Run MCP test makes a live public-tool request, without new model inference.” |
| Why are there 12 plants in the connection test and 7 in the trace? | “Twelve is the illustrative sample inventory. Seven is the candidate count in a separate recorded model perception response.” |
| Is it 100% accurate? | “Three weed predictions matched out of three predictions, but only three of eighty-eight annotated weeds were found. That is 3.4% weed recall, and the target was not met.” |
| Does the weak recall invalidate the product? | “It is a real limitation that we publish. The working result is the auditable perception-and-review loop. Better weed recall is the next model gate before field use.” |
| Are the drones or robots actually connected? | “No physical device has been integrated. We demonstrate the upper-level agent interface and a real Muse tool-use trace.” |
| Can an agent fly, spray or navigate from this output? | “No. It receives source-image coordinates and human-review requirements. Flight, navigation, GPS projection and physical actions are outside this prototype.” |
| Why does GP-001 have different labels in different screens? | “The landing and agent trace are separate recorded requests, and their IDs are scoped to their own results. Within the review workspace, the original model label and a human decision are kept distinct.” |
| Do browser decisions synchronize to the robot? | “No. Current browser review decisions remain in that tab, with export available. MCP is stateless per request and does not read those browser decisions.” |
| Have you validated moving-video identities? | “No. Both genuine four-second BoniRob clips returned zero candidates. They do not prove weed-free ground or successful tracking.” |
| What impact have you measured? | “We measured this public-data check. We have not measured farmer time savings, pesticide reduction or real-farmer outcomes.” |
| What comes next? | “Improve weed recall on frozen evaluation data, validate identities with suitable ground truth, then run farmer trials. Geographic mapping needs calibration and positioning work.” |

## 当前演示路线验证记录

2026-11-03 在正式域名核验：

- A：Real evidence 的 GP-004 对应同 ID 的来源框、裁切和模型理由。
- B：GP-001 从模型 weed 经人工 Keep for review 保存后，原始标签仍为 weed，人工状态为 deferred。
- B：现场 Run MCP test 返回 **3 tools discovered · 12 sample plants returned**。这里只调用公开工具，没有发起新的 Meta 推理。
- A：三个 Muse 步骤依次显示 capabilities、analyze_frame 返回 7 个候选、最终 human_review；证据 ID 为 GP-001 和 GP-007，treatment_authorized 为 false。
- C：报告确认 20 张冻结验证图、3/88 杂草召回、仅 3 个正确 weed 预测及视频追踪未验证。
- Field atlas：四个示意点已对照原图裁切校准；发布前本地核验 320、390、641、1280、2251px，标签无重叠，四个选择及两条 Review 筛选通过。

这次是界面操作核验，没有做真人语音计时、农户测试或提交参赛视频。正式限时、评分规则、是否强制现场模型推理及材料公开要求，应在提交前与比赛规范核对。

## 原始证据与来源

- [Recorded Muse trace](https://greenpoint-vert.vercel.app/assets/verified-run/agent-trace.json)
- [完整公开验证结果](https://greenpoint-vert.vercel.app/validation.html)
- [机器可读结果](https://greenpoint-vert.vercel.app/validation-summary.json)
- [MCP 实现与接入说明](MCP.md)
- [公开数据署名与许可](../public/licenses/public-data.md)

下一步：按主路线完成两次真人计时排练，随后录制完整备份；提交前核对赛事正式限时和现场推理要求。
