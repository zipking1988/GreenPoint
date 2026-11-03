# GreenPoint 三分钟演示脚本

23像素判断分歧 → 一次真实Meta复核与导出 → Muse工具调用 → 本地农业识别 → 同图精度提升与去重 → 保留失败 → 当前成果与下一步。

时间线为 00:00–03:00。英文旁白由 ElevenLabs 美国女声 Bella 朗读；每段留有操作停顿。画面中文说明不进入配音。

线上段使用已有真实生产录屏；农业段为实际本地推理输出和公开标注的剪辑展示，持续标识Local research prototype，尚未部署。新图像只作原始像素放大和测量结果可视化，不伪造网页或推理进度。

## 分镜与旁白

### 00:00–00:10 一个可核查的分歧

画面与操作：同一公开图像中的23像素植物：先显示前实验的crop框，再揭示公开标注weed与新农业检测框。保留selected example。

入口：[打开画面](https://greenpoint-vert.vercel.app/dashboard)

屏幕主字幕：**23px / CROP OR WEED?**

来源标注：Selected public-data example / local research

英文旁白：

This tiny plant was labeled crop. The annotation says weed. GreenPoint makes that disagreement inspectable.

### 00:10–00:24 用户问题与Meta职责

画面与操作：展示现有真实线上工作区与SAM、Muse职责。明确Recorded real Meta run。

入口：[打开画面](https://greenpoint-vert.vercel.app/dashboard)

屏幕主字幕：**SAM + MUSE / ONLINE REVIEW FLOW**

来源标注：Actual online product / recorded Meta inference

英文旁白：

For growers reviewing scattered fields, a label alone isn't enough. Our online flow uses Sam three point one for plant regions, and Muse Spark for structured visual suggestions.

### 00:24–00:48 一次完整的复核

画面与操作：使用一次连续GP-001缩放平移，再显示Keep for review、Save与原始/人工状态；不重复展示同类清单。

入口：[打开画面](https://greenpoint-vert.vercel.app/dashboard)

屏幕主字幕：**SOURCE PIXELS → MODEL → HUMAN**

来源标注：Actual online review interactions / same session

英文旁白：

Select a candidate. Its box connects to pixels from that exact source image. Zoom and pan: the evidence stays with the plant. Here, the model suggests weed. I keep it for review and save. The original suggestion and my decision remain separate.

### 00:48–01:01 判断随记录导出

画面与操作：切Video，点击实际导出，放大刚导出的真实CSV字段；不编造表格。

入口：[打开画面](https://greenpoint-vert.vercel.app/dashboard)

屏幕主字幕：**A TRACEABLE REVIEW RECORD**

来源标注：Actual product and exported CSV

英文旁白：

Switch to the video inventory, then export. The same review follows the session. The CSV preserves the original label, human status, source, and run identity.

### 01:01–01:22 Muse实际调用工具

画面与操作：按discover、perception、human_review顺序各显示一次真实调用回放，并放大公开trace原字段。

入口：[打开画面](https://greenpoint-vert.vercel.app/dashboard)

屏幕主字幕：**MUSE → MCP → EVIDENCE → HUMAN REVIEW**

来源标注：Separate real Muse agent trace / software only

英文旁白：

Muse can request evidence too. In this separate recorded run, it discovers our M C P tools and requests authenticated frame perception. Seven candidates come back. Muse cites evidence IDs and chooses human review.

### 01:22–01:40 实际本地农业识别

画面与操作：展示本轮实际重新运行的RGB输入、检测输出、运行耗时与模型来源。不是线上功能录屏，不做伪造加载进度。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**LOCAL AGRICULTURAL PROTOTYPE**

来源标注：Actual local CPU output / published pretrained weights

英文旁白：

We then tested a local agricultural expert, using published PhenoBench weights. This is real CPU inference on the same RGB frame, with no annotations sent to the model. It is a research prototype, separate from the online Meta flow.

### 01:40–01:57 定位找回案例

画面与操作：源图定位51像素目标并放大；并排前方案、新检测器，最后揭示同源GT。放大只用原始像素。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**A 51px WEED RECOVERED**

来源标注：Selected public-data example / same source pixels

英文旁白：

On this selected example, the previous pipeline missed a fifty-one-pixel weed. The agricultural detector recovers its box. Both views show the same source pixels, checked against the public annotation.

### 01:57–02:17 完整同图评测

画面与操作：同40张196株杂草的实验对照：precision76.1→96.7、recall60.2→60.7、falseflags37→4；不得拿另一批39.7%作因果提升。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**SAME 40 IMAGES / FEWER FALSE FLAGS**

来源标注：Frozen local research comparison / full 40-image cohort

英文旁白：

We chose settings on twenty calibration images, then evaluated forty different images. On that same comparison, weed precision rose from seventy-six point one to ninety-six point seven percent. Recall stayed near sixty-one percent. False weed flags fell from thirty-seven to four.

### 02:17–02:31 切片碎片去重对照

画面与操作：展示真实切片预测中被包含的小框和保留完整框，接固定消融指标。说明selected整图不使用该去重。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**TILES / CONTAINMENT CLEANUP**

来源标注：Separate fixed tile ablation / not the primary method

英文旁白：

Tiles add fragments. Containment cleanup raised tile precision from eighty-seven point two to ninety-two point five percent, with sixty-three point three percent recall.

### 02:31–02:47 小目标局限与人工复核

画面与操作：显示真实24像素漏检和<=32像素分组26/70→19/70；再显示人工deferred原始结果。源图坐标，无GPS或硬件。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**KEEP THE REMAINING FAILURES VISIBLE**

来源标注：Measured limitations / public agricultural domain only

英文旁白：

The smallest weeds remain difficult: nineteen of seventy targets at thirty-two pixels or less were recovered. Human review stays essential. This is public-data validation; movement tracking and independent farm trials remain unvalidated.

### 02:47–03:00 明确当前成果与下一步

画面与操作：清楚并列已上线Meta复核与本地农业原型，末尾产品名、URL、下一步；不宣称农业原型已上线。

入口：[打开画面](Local research evidence bundled with this submission)

屏幕主字幕：**EVERY JUDGMENT HAS A FRAME**

来源标注：Online Meta review + local research / no hardware

英文旁白：

Inspectable Meta evidence. Traceable human decisions. A tested local recognition prototype. Next: cloud integration and farmer trials. GreenPoint. Every judgment has a frame.

## 本版旁白制作

本版11段旁白全部使用此次验证的ElevenLabs Bella美国女声生成；保留原始音频和字符时间戳，不读取密钥到提交包。

## 录制与事实边界

1. 线上段使用已有真实生产录屏，每类操作只讲一次；Meta推理结果是明确标注的recorded real run。
2. 工作区GP-001与Muse MCP是两次独立推理。保留各自原始输出、置信度、运行身份，不拼接模型记录。
3. 农业段读取本轮真实本地CPU推理、完整40图评测和固定消融；持续显示Local research prototype / not deployed。
4. 农业检测器输出框，未生成SAM掩膜或Muse理由。不得给它拼接另一次运行的掩膜和解释。
5. 同图对照精确率76.1%→96.7%、召回60.2%→60.7%、误报37→4；不以另一批39.7%召回作因果提升。
6. 去重固定消融87.2%→92.5% precision、63.3% recall；最终选定整图方法不使用该去重。
7. <=32px仍退步26/70→19/70；没有独立农场、日本手机场景、运动追踪或硬件验证。
8. 所有研究照片和放大均保留PhenoBench / Weyler et al. / CC BY-SA 4.0归属；没有生成额外植物细节。

## 数据和声音来源

真实图像、录制 Meta 结果和代理 trace 来自现有线上产品及 GitHub main。PhenoBench / Sugar Beets 2016 的公开数据归属见 [项目数据许可](https://greenpoint-vert.vercel.app/licenses/public-data.md)。画面角落保留数据来源；在视频说明中附该链接。

声音使用 ElevenLabs Bella，账户 API 返回的标签为 female / american。原始语音逐段生成，保留时间戳；剪辑配音会补入操作留白，必要时进行最多 8% 的保音高语速调整。

官方提交入口要求三分钟视频：[提交表单](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)。
