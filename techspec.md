# GreenPoint — Technical Specification

> 带证据的植物候选清单 / Evidence-backed plant candidate inventory
> 版本：v0.2（Hackathon 原型；含历史设计草案）
> 更新：2026-10-31

---

## 1. 概览

### 1.1 当前实现与验证状态

当前工作区实现了可在浏览器预览视频、检查植物候选、人工复核并导出 CSV 的原型。视频最长可预览 **120 秒**；只有 **≤6 秒**的短片可启动分析，按 0.5 秒间隔采样，最多 12 帧。较长视频需要先裁短，不会静默分析前六秒。

模型接口和错误处理已实现，但真实 Meta 凭据尚未取得，**真实分割、分类、耗时、准确率和费用均未完成验收**。示例会话是 AI 生成的静态画面与 12 条手工记录，不是真实模型结果。当前不生成统一田间坐标、地理地图、施药建议或设备作业指令。

### 1.2 当前数据流程

```text
浏览器导入视频 → 本地预览；≤6 秒短片最多采样 12 帧
        ↓ 用户启动分析后发送采样图像
/api/analyze: SAM 3.1 图像分割 → 候选框及掩码
        ↓
连续帧的保守几何关联 → 不确定关联保留为独立候选
        ↓
按代表帧候选框裁图 + 作物上下文 → Muse Spark 三档建议
        ↓
源帧 / 帧内图集 → 人工确认或暂缓 → CSV
```

追踪使用相邻帧中心距离、框面积比例与歧义门槛；没有相机运动补偿、光流、单应性或匈牙利匹配，也不保证同一株始终只有一个身份。分类按最多 8 个候选一批，置信度未校准。分析失败、取消或达到数量上限时，已完成结果保留为部分结果。坐标是归一化的源帧坐标，不是 GPS；原始标签与人工决定分开保存。

原视频和分析会话保留在当前标签页；导出 CSV 后需确认文件已保存。浏览器 `/api/analyze` 的访问码与 `/api/mcp` 的访问令牌分开。MCP 仅提供带强制人工复核标志的单帧感知，不包含浏览器中的人工决定或设备控制。

### 1.3 当前技术栈与入口

| 层 | 当前实现 |
|---|---|
| 前端 | React / Vite；`landing/src/dashboard/` |
| 视频采样与候选关联 | 浏览器 Canvas；`video.js` / `tracker.js` |
| 服务端模型接口 | Node.js `fetch`；`landing/lib/meta-api.js` 与 `landing/api/analyze.js` |
| SAM 解析 | JavaScript 包 `@meta-sam/parser` |
| 运行与回归 | Vercel Node API；`landing/tests/analysis.test.mjs`、`mcp.test.mjs`、`sites-worker.test.mjs` |

模型凭据 `MODEL_API_KEY` 和 dashboard 访问码 `ANALYSIS_ACCESS_TOKEN` 只配置在服务端；MCP 使用独立的 `MCP_ACCESS_TOKEN`。更多当前运行方式见 [landing/README.md](landing/README.md) 与 [MCP 指南](landing/docs/MCP.md)。

### 1.4 未来方向

统一田间定位、全田地图、运动补偿、设备集成及处理建议均为未来研究方向，本轮不实现；是否采用以及安全、隐私和可靠性要求均需另行验证。

---

## 历史设计草案（第 2–10 节，非当前实现）

以下保留早期调研、示例代码和规划，**不代表已经实现、测试通过或可直接用于演示**。其中的 Python 栈、视频 API、光流、匈牙利匹配、路径/GPS 坐标、处理建议、GeoJSON、示例数值和费用估算均不是当前原型能力。模型限制、价格、竞赛评分和其他外部事实也可能过期或未经核实；调用前须查阅最新官方资料。当前实现以第 1 节及代码为准。

## 2. 早期约束与设计假设（历史草案）

### 2.1 🔴 决定性发现：SAM 3.1 视频追踪有对象数量限制

> ⚠️ **表述须保守。** Meta 博客称单次 forward pass 可追踪**最多约 16 个对象**；第三方资料称默认/上限为 16，但也有分析称超出后会分桶（batching）处理。**具体以官方 Limits 页面原文为准。**
> **早期拟定的对外表述（数字未经核实，不可直接引用）**：
> "视频追踪模式对同时追踪的对象数量存在明确限制，且一帧田间画面通常有 30–100 株，
> 因此 GreenPoint 采用**抽帧 + 图像模式 + 自建跨帧追踪器**。"
> **不要断言"上限就是 16"** —— 这个数字可能被技术审查抓住。

早期方案假设图像模式适合逐帧处理，但不能据此声称返回每一个匹配实例。当前服务端每帧最多保留 32 个检测，整次运行最多保留 96 个候选；达到上限会标记为部分覆盖。

“每帧 30–100 株”是早期估计，不是本项目的实测结果。

### 2.2 决策：抽帧 + 图像模式 + 自建追踪器

| 方案 | 单帧株数 | 60 秒素材成本 | 跨帧 identity | 结论 |
|---|---|---|---|---|
| 视频追踪模式 | **受限**（约 16 量级，以官方 Limits 为准） | $0.36 | ✅ API 免费给（object id 跨帧稳定） | 不满足田间密度 |
| **抽帧 + 图像模式** | 模型与应用均有各自限制 | 2 fps × 60 s 的历史估算，不适用当前原型 | ❌ 需自建 | 当前采用图像模式，但仅分析 ≤6 秒 |

以上是早期方案比较，不是实测费用或完整性保证；本轮调用预算规则见第 7 节。

附带收益：自建追踪器正好命中评审标准 **Technical Depth 20%** —— 官方原话 "whether you go beyond a basic integration"。自己写追踪器比单纯调 API 有说服力得多。

### 2.3 早期记录的模型约束（待核，不是当前上传范围）

| 约束 | 值 |
|---|---|
| 视频格式 | MP4 / MOV，H.264 / H.265 / MPEG-4（**VP9 / WebM 不接受**） |
| 视频最长 | 15,000 帧（约 10 分钟）/ 请求 |
| 视频计费 | 最少 50 帧 / 请求 |
| 概念提示 | **一个概念 / 请求**，无多概念语法 |
| 零匹配 | 正常结果，返回空 `output_text`，非错误 |
| 帧索引 | `<Nf>` **可能跳帧、可能乱序**，必须读标记值而非行位置 |

---

## 3. SAM 3.1 API 早期研究（历史草案，非当前客户端代码）

### 3.1 请求

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.meta.ai/v1",
    api_key=os.environ["MODEL_API_KEY"],
)

with client.responses.stream(
    model="sam-3.1",
    input=[{
        "type": "message",
        "role": "user",
        "content": [
            {"type": "input_text", "text": "plant"},          # 概念提示
            {"type": "input_image", "image_url": data_url},   # base64 data URL
        ],
    }],
    stream=True,
    metadata={
        "mask_encoding": "one_bit",        # payload 更小，流式更快
        "include_confidence": "true",      # 每个 box/mask 带 c 字段
    },
) as stream:
    for event in stream:
        if event.type == "response.output_text.delta":
            buffer += event.delta
```

### 3.2 概念提示撰写规则（务必遵守）

| ✅ 正确 | ❌ 错误 | 原因 |
|---|---|---|
| `"plant"`、`"corn seedling"`、`"weed"` | `"segment the plants"` | 命令式不可靠，常返回空 |
| `"red square"`（加属性收窄） | `"bus, bicycle"` | 逗号/分号/加号列表 → 零匹配 |
| 短名词短语 | 长描述 | 填充词会**降低**匹配质量 |
| 单概念 | `"cat or dog"` | 布尔 OR 结果不稳定 |
| 单纯概念 + 应用侧过滤 | `"person on the left"` | 空间描述只被部分遵守 |
| | `"person not wearing a hat"` | 否定式结果不一致 |

多概念方案是早期设想。当前分割请求使用 `"plant"`，再由 Muse Spark 给候选分类；不承诺检测到全部植物。

### 3.3 响应 grammar

```
line   ::= FRAME record ( "," record )*
record ::= OBJECT_ID box mask
box    ::= "<|box;x1=INT;y1=INT;x2=INT;y2=INT;w=INT;h=INT[;c=DECIMAL]|>"
mask   ::= "<|mask;x=0;y=0[;c=DECIMAL];data=H,W,ENC payload|>"
FRAME  ::= "<" INT "f>"
ENC    ::= "~"   # lossless (默认)
         | "!"   # one_bit
```

示例（图像，两株）：
```
<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=320;h=334;c=0.96|><|mask;x=0;y=0;c=0.96;data=27,60,!...|>,1<|box;...|><|mask;...|>
```

**陷阱**
- `data=H,W` 是 **height,width（行,列）**，不是宽高
- payload 是 **base85，不是 base64**（base64 正则匹配不上）
- payload 内部可能含 `!` 或 `~`，**只读 `H,W,` 后的第一个字符**作为编码标记
- `x2`/`y2` 是 **inclusive**
- 坐标以**媒体自身像素**为准（含 EXIF 旋转后的显示尺寸）

### 3.4 解析（用官方库，别手写）

```bash
pip install meta-sam-parser   # Python >= 3.10, 零依赖
```

```python
from meta_sam_parser import (
    parse_image_stream, parse_video_stream,
    records_of_kind,
    decode_mask_to_raster,   # -> row-major uint8 [0/1], len = H*W
    decode_mask_to_rle,      # -> COCO RLE {size:[h,w], counts}  便于算 IoU
    decode_mask_to_svg_path, # -> "M…L…Z"
)

result = await parse_image_stream(events).finalResult
if result.outcome.status != "completed":
    warn(...)

for box in records_of_kind(result.records, "box"):
    print(box.objectId, box.left, box.top, box.right, box.bottom, box.confidence)

for mask in records_of_kind(result.records, "mask"):
    raster = decode_mask_to_raster(mask.mask)
```

> ⚠️ 使用 `include_confidence` 需 `meta-sam-parser >= 0.0.6`（Python）/ `>= 0.0.13`（TS）。更早版本会把带 `c` 的行报为 `malformed_record` 且**不返回任何记录**。

### 3.5 视频上传（若后续需要视频模式）

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4   # 避免服务端 remux
```

```bash
curl -X POST "https://api.meta.ai/v1/files" \
  -H "Authorization: Bearer $MODEL_API_KEY" \
  -F "purpose=user_data" -F "file=@clip.mp4"
# -> {"id": "file-842549258569145", ...}
```
上传是同步的，`200` 即就绪。之后用 `{"type":"input_video","file_id":"file-..."}` 引用。

---

## 4. 跨帧追踪器设想（历史草案，以下算法未实现）

### 4.1 为什么必须自建

抽帧 + 图像模式下，每帧的 object id **只在帧内有意义**，不跨帧。同一株在 60 帧里出现，必须合并成 1 株，否则清单会重复计数十倍。

### 4.2 曾提出的算法（未实现）

**Step 1 — 相机运动补偿**
农户沿田埂行走，相机运动近似平移 + 轻微旋转。
- 用 `cv2.calcOpticalFlowPyrLK` 取稀疏特征点
- `cv2.findHomography` 估计相邻帧单应性 `H(t→t-1)`
- 累积变换到参考帧坐标系（或直接做帧间预测）

**Step 2 — 预测 + 关联**
- 把 `t-1` 帧各 track 的 box 经 `H` 变换 → 得到 `t` 帧的**预测框**
- 预测框与 `t` 帧检测框算 IoU，构造代价矩阵
- `scipy.optimize.linear_sum_assignment` 匈牙利分配
- IoU 阈值：`0.30`（农田密集场景需调）

**Step 3 — 轨迹生命周期**

| 规则 | 值 | 理由 |
|---|---|---|
| 确认新 track | 连续 **2 帧**匹配 | 抑制抖动/误检 |
| 关闭 track | 连续 **5 帧**未匹配 | 植株已离开视野 |
| 最小观测帧数 | **3 帧** | 低于此视为噪声，丢弃 |
| 置信度过滤 | `confidence >= 0.5` | 用 `include_confidence` |

**Step 4 — 代表帧选择**
每个 track 选 **`mask 面积最大 × confidence 最高`** 的那一帧作为该株的代表观测（植株最完整、最清晰），供 Muse Spark 判读。

### 4.3 Track 数据结构

```python
@dataclass
class Track:
    track_id: int
    observations: list[Observation]   # frame_idx, box, mask_rle, area_px, conf
    centroid_path: list[tuple[float, float]]
    best_frame_idx: int
    best_mask_rle: dict
    best_box: tuple[int, int, int, int]
    mean_conf: float
    n_observations: int
```

### 4.4 坐标输出（三档，渐进）

| 档 | 内容 | 依赖 |
|---|---|---|
| L1 | 参考帧图像坐标 + 帧索引 | 仅视觉 |
| L2 | 沿巡检路径的**累积位移**估计 | 相机运动 + 假设步速 |
| L3 | **地理坐标**（WGS84） | 视频 GPS 遥测 / 手机传感器日志 |

L2/L3 是历史设想，当前均未实现。当前仅导出各候选所选源帧的归一化图像坐标及帧信息。

---

## 5. Muse Spark 判读设想（历史草案，与当前实现不同）

### 5.1 判读对象

`track.best_frame` 上按 `mask` 抠出的**单株图像**（保留原图背景 + mask 高亮，比纯白底更利于模型判断上下文）。

### 5.2 关键设计：不声称诊断级准确率

通用 VLM 对细粒度植物分类**不可靠**，且 4 天内无法做可信准确率评测。因此输出**三档**，强制人工复核：

```json
{
  "label": "crop" | "weed" | "uncertain",
  "confidence": 0.0-1.0,
  "reasoning": "叶形狭长、叶脉平行，与畦间栽培的作物不符",
  "suggested_action": "spot_spray" | "skip" | "manual_review"
}
```

- `uncertain` **必须存在**，且 UI 上明确标为"需人工复核"
- 绝不输出具体病害名 / 杂草学名（VLM 做不到，且错了会直接毁掉 Technical 分）

### 5.3 批处理

Muse Spark 1.3 有 **1M 上下文**，可把多株图塞进一次请求。
**策略：每批 20 株**，`response_format` 用 JSON Schema 强制结构化输出。

```python
resp = client.responses.create(
    model="muse-spark-1.3",
    input=[{
        "type": "message",
        "role": "user",
        "content": [
            {"type": "input_text", "text": SYSTEM_PROMPT + crop_context},
            *[{"type": "input_image", "image_url": url} for url in batch],
        ],
    }],
    text={"format": {"type": "json_schema", "schema": PLANT_SCHEMA}},
)
```

### 5.4 曾提出的施药建议生成（未实现，本轮不做）

判读完成后，**第二次** Muse Spark 调用：输入汇总统计（总株数、杂草率、密度热点、地块信息），输出作业建议（药剂类别、定点施药 vs 人工拔除、优先处理区域）。

> 这一步是 **Tooling 25%** 的第二个模型能力点，也是 Impact 叙事的落点。

---

## 6. 数据模型设想（历史草案，不是当前导出结构）

### 6.1 假设的输出 JSON（虚构示例，不是实测结果）

```json
{
  "schema_version": "0.1",
  "source": {
    "video": "field_walk_001.mp4",
    "duration_s": 62.4,
    "fps_source": 30,
    "fps_sampled": 2,
    "frames_sampled": 125,
    "media_size": [1920, 1080]
  },
  "crop_context": "lettuce",
  "summary": {
    "plants_total": 214,
    "weed_count": 63,
    "uncertain_count": 18,
    "weed_ratio": 0.294,
    "estimated_herbicide_saving_pct": null
  },
  "plants": [
    {
      "track_id": 7,
      "label": "weed",
      "confidence": 0.82,
      "suggested_action": "spot_spray",
      "first_seen_frame": 12,
      "n_observations": 19,
      "area_px": 4820,
      "best_frame_idx": 44,
      "box": [812, 540, 903, 631],
      "position": {
        "frame_space": [857, 585],
        "along_path_m": 4.2,
        "geo": null
      }
    }
  ],
  "recommendation": {
    "mode": "spot_spray",
    "priority_zones": [[0.0, 6.5], [18.2, 24.0]],
    "notes": "密度热点集中在巡检路径前段与末段，建议优先定点处理"
  }
}
```

### 6.2 曾提出的导出格式（未实现）

| 格式 | 用途 |
|---|---|
| **GeoJSON** | 导入 GIS / 农业管理平台 |
| **CSV** | 除草机 / 无人机作业清单（track_id, x, y, action） |
| **叠加视频** | Demo 与农户复核 |

当前仅导出供人工复核的 CSV，坐标为源帧归一化坐标；没有 GeoJSON、设备作业清单或叠加视频导出。

---

## 7. 历史成本模型（60 秒假设，不适用当前原型）

| 步骤 | 用量 | 单价 | 成本 |
|---|---|---|---|
| 抽帧 | 60 s × 2 fps = 120 帧 | — | $0 |
| SAM 3.1 分割 | 120 图 | $2.50 / 千图 | **$0.30** |
| Muse Spark 判读 | 214 株，约 160k in + 24k out | $1.25 / $4.25 每 M | **$0.30** |
| Muse Spark 建议 | 1 次 | — | ~$0.01 |
| **合计** | | | **≈ $0.61** |

> 上表是早期假设，既不是当前 ≤6 秒流程的报价，也不是实测成本；历史价格和 credits 数量不得直接用于调用决策。本次真实联调总预算为 **$5（包含 credits 消耗）**。调用前需核实官方价格、请求上限和剩余预算；无法确认时停止调用，不自动付费重试。

---

## 8. 展示层早期草案（示意，不代表当前界面）

### 8.1 主界面（移动端优先）

```
┌──────────────────────────┐
│                          │
│   视频播放 + 掩码叠加     │  ← 杂草标红、作物标绿
│   （逐株框 + 像素掩码）   │
│                          │
├──────────────────────────┤
│ 株 #007  weed    0.82    │  ← 清单实时滚动
│ 株 #012  crop    0.91    │
│ 株 #015  uncertain 0.55  │
│ ...                      │
├──────────────────────────┤
│ 总计 214 株 · 杂草 63     │
│ 减药效果：未测量           │
│ [导出 GeoJSON] [导出 CSV] │
└──────────────────────────┘
```

### 8.2 当前演示建议

展示 ≤6 秒素材、候选证据、人工复核和 CSV；示例必须标明为示例。不要展示未经测量的减药比例或虚构地图。真实模型凭据未就绪时，不得把模拟结果说成真实推理。

---

## 9. 曾计划的目录结构（未采用）

```
greenpoint/
├── profile.md              项目雏形
├── hackathon.md            参赛手册
├── techspec.md             本文件
├── open.md                 公开数据与 HuggingFace 资源手册
├── README.md
├── requirements.txt
├── src/
│   ├── config.py           配置 / 环境变量
│   ├── ingest.py           视频抽帧 + 元数据
│   ├── synth.py            滑动窗口合成伪巡检视频（公开数据用）
│   ├── sam_client.py       SAM 3.1 封装（含 prompt 规则）
│   ├── segment.py          逐帧分割调度 + 缓存
│   ├── track.py            跨帧追踪器（自研核心）
│   ├── classify.py         Muse Spark 判读（批处理 + JSON schema）
│   ├── evaluate.py         基于 GT 的定量评测（去重准确率等）
│   ├── report.py           汇总 / 施药建议 / GeoJSON+CSV 导出
│   ├── overlay.py          掩码叠加视频渲染
│   └── pipeline.py         端到端编排
├── web/
│   └── index.html          移动端展示页
├── data/
│   ├── raw/                原始视频 / 合成帧
│   ├── frames/             抽帧缓存
│   └── out/                结果
└── tests/
```

---

## 10. 曾计划的 Python 依赖与环境（未采用）

```bash
python >= 3.10

pip install meta-sam-parser     # 官方 SAM 解析（零依赖）
pip install openai              # SDK（base_url 指向 api.meta.ai）
pip install opencv-python numpy scipy pillow
```

```bash
export MODEL_API_KEY=...        # dev.meta.ai → Billing 绑卡 → API keys
```

> ⚠️ **不绑卡则 Create API key 是灰的**（新账户显示 "No payment method" banner）。这是最容易被误判为"credit 没到账"的卡点。

---

## 11. 当前风险与处理方式

| 风险 | 当前处理方式 |
|---|---|
| **真实模型凭据未取得** | 先使用本地预览和明确标注的示例；真实模型联调保持未验收。 |
| **判读或关联不准确** | 输出三档候选，保留图像证据并由人复核；模糊关联保持独立，不宣称身份唯一或准确率。 |
| **API 失败、取消或达到上限** | 保留当前标签页中已完成的部分结果与处理日志；没有落盘缓存或断点续跑。 |
| **预算无法确认** | 不发起真实模型调用；全部联调及 credits 消耗合计不超过 $5。 |
| **演示素材与地面真值不足** | 记录素材来源、许可与裁剪方式；将挑战素材中的错分、重复和弃权作为观察，而非准确率结论。 |

---

## 12. 验证与发布里程碑

| 阶段 | 状态 / 完成条件 |
|---|---|
| 本地工作流与模拟回归 | 代码已实现；每次变更后按第 13 节复验。 |
| 真实模型单帧联调 | 凭据和预算可用后执行；当前未验收。 |
| 真实短片验收 | 同一正常短片至少两次独立全链路运行，另记录遮挡或模糊短片的边界；当前未验收。 |
| 预览与生产 | 先检查预览部署；真实验收及回归通过后再发布生产，失败时保留稳定版本。 |
| 备用演示 | 录制完整工作流；较慢推理可展示同一素材此前完成的真实结果，并如实说明。 |

---

## 13. 当前验证计划

| 测试 | 方法 / 通过标准 |
|---|---|
| 采样与关联 | 覆盖短于 1 秒、恰好 6 秒及更长预览素材；连续静止植物可关联，稀疏或模糊关联不强行合并。 |
| Review 与导出 | 检查确认、暂缓、筛选、旧示例迁移、CSV 来源与坐标；未保存结果在离开前提示。 |
| 失败恢复 | 覆盖缺少配置、错误访问码、429、超时、分类失败、取消、零检测与候选上限；部分结果不显示为完整成功。 |
| 回归 | 运行 `npm run test:analysis`、`npm run test:mcp`、`npm run build` 和 `npm run test:sites`，并检查桌面与移动端工作流。 |
| 真实验收与成本 | 凭据就绪后在 $5 总预算内记录单帧和短片的调用阶段、耗时、候选数及错误；不记录凭据。 |

---

## 14. 明确不做（Scope 边界）

| 不做 | 原因 |
|---|---|
| 病害识别 | VLM 细粒度分类不可靠，4 天无法验证 |
| 杂草学名分类 | 同上；输出三档即可 |
| 原生移动 App | 时间不允许，且网页更利于评审 |
| 机器人/无人机执行 | 明确拆出，本次只做识别层 |
| 地理定位、全田地图与施药建议 | 当前仅有帧内坐标和待人工复核的候选清单 |
| 数据库与长期存储 | 视频和真实分析结果仅保留在当前标签页 |
| 模型微调 | SAM 3.1 零样本即可，无需训练 |

> 这些边界**要写在提交材料里**——清楚说明不做什么，是 Technical Depth 的加分项，也避免评委误判。
