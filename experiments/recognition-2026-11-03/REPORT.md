# GreenPoint recognition experiments — 2026-11-03

视频制作已暂停。本次完成的是可复现的识别实验、本地识别原型与真实案例，尚未部署到线上。

## 决策

**暂不训练 crop/weed 分类头。** 在新 20 张确认图片上，原方案识别 2/78 株杂草（召回 2.6%），锁定的混合方案识别 31/78（39.7%），精确率 79.5%。保留了所有漏检、部分边缘植物与失败请求。

混合方案仍有 42 株杂草没有 IoU≥0.5 的候选匹配；有候选但判错/不确定共 5 株。此结果把优先级指向小目标定位、实例碎片与去重，现阶段新增分类头解决不了主要漏检。分类头后续应由真实目标农田的独立数据和成组划分实验决定，而不是为了比赛宣称“训练了模型”。

固定这批候选，即使分类器完全分对，也最多覆盖 36/78 株杂草（46.2%），仍低于 60% 召回目标。仅替换农业判别、不加切片的整图方案为 25/78，精确率 96.2%；它更适合作为下一版人工复核识别功能的优先集成候选。切片在这批新图片上只额外找回 6 株，且增加误报，保留为研究开关，尚不作为线上默认。这里是依据验证结果作出的产品取舍，没有改动冻结参数或重新选择测试结果。

原定门槛为 weed precision ≥90%、recall ≥60%、crop→weed ≤5%；本轮混合方案通过状态：**False**。当前只能进入人工复核研究流程。

## 数据与冻结

- 5 张官方 train 图片仅用于选参数；公开农业模型可能已经训练过这些图片，所以开发集不作泛化证据。
- 旧 20 张官方 val 是先前检查过的诊断集，用于配对比较。
- 新 20 张官方 val 在本轮推理前按 SHA256(recognition-v2-20261103:filename) 选定，与原 25 张及旧 smoke 图片不重合；选择文件、输入 SHA 和冻结参数 SHA 均保留。
- 新集只对本轮选择过程保持独立。作者预训练 checkpoint 可能曾用官方 val 选模型；同一公开农业域不等于独立农场、跨作物、日本手机拍摄或现场验证。
- 只有 RGB 进入模型；标注由评分脚本单独加载。没有训练、人工补标签或测试集调参。

## 方法

1. **Current**：当前真实 SAM 3.1 whole-frame + Muse Spark 1.3 baseline；旧集复用原始响应，新确认集实际重跑同一实现、提示与 0.75 置信阈值。
2. **ERFNet CC**：官方 PhenoBench 预训练 ERFNet，原始 1024 RGB、逐图通道均值/样本标准差、3 类语义输出，8 邻域连通域转 box，最少 64 像素。语义模型不是实例模型，碎片、合并和重复都会计入对象错误。
3. **Whole + ERFNet**：保留原 SAM 候选；用官方 SAM 解码掩膜内 ERFNet 概率均值判别，隔离分类变化。
4. **Tiles + ERFNet**：四个 640px tile，坐标偏移 0/384，每块放大到 1024 送 SAM，按源图重投影，IoU≥0.5 NMS。
5. **Whole + tiles + ERFNet**：整图和切片候选合并；相同分类器与相同 NMS。植被概率均值 ≥0.5、crop/weed 概率纯度 ≥0.9 才赋类，否则 uncertain；数值未校准、均需人工复核。

开发阶段也运行了九个 512px tile；其表现更差，没有进入最终验证。参数仅从开发集一次选择，随后冻结。农业权重来自作者，不是我们训练，也不是 Meta 模型；Meta 在混合方案中贡献 SAM 分割，Muse 仍属于原方案比较和现有产品的独立 agent/MCP 工作流。

## 真实配对结果

评分使用与原 benchmark 完全一致的 class-agnostic、greedy、one-to-one box IoU≥0.5。重复预测和没有匹配的 weed 都降低精确率；uncertain 不计为正确识别。像素 IoU 独立报告，不能与对象召回混为一谈。

### 旧诊断集（20 张）

| 方法 | 正确杂草 / 全部杂草 | 召回率 | 精确率 | 作物→杂草 | 候选覆盖杂草 |
|---|---:|---:|---:|---:|---:|
| current | 3/88 | 3.4% | 100.0% | 0/168 | 39.8% |
| erfnet_cc | 71/88 | 80.7% | 50.4% | 3/168 | 83.0% |
| whole+erfnet | 33/88 | 37.5% | 94.3% | 0/168 | 39.8% |
| tiles640+erfnet | 49/88 | 55.7% | 83.1% | 0/168 | 61.4% |
| whole+tiles640+erfnet | 49/88 | 55.7% | 81.7% | 0/168 | 61.4% |

混合方案相对原方案的召回变化：+52.3 个百分点；按图片配对 bootstrap 5000 次的 95% 区间 [+39.5, +65.5] 个百分点。这是小规模、同域、相关图片的描述性区间，不能支持独立农场结论。ERFNet 像素 IoU：crop 95.5%，weed 68.4%。

### 新确认集（20 张）

| 方法 | 正确杂草 / 全部杂草 | 召回率 | 精确率 | 作物→杂草 | 候选覆盖杂草 |
|---|---:|---:|---:|---:|---:|
| current | 2/78 | 2.6% | 100.0% | 0/148 | 38.5% |
| erfnet_cc | 58/78 | 74.4% | 46.4% | 4/148 | 75.6% |
| whole+erfnet | 25/78 | 32.1% | 96.2% | 0/148 | 38.5% |
| tiles640+erfnet | 30/78 | 38.5% | 75.0% | 0/148 | 44.9% |
| whole+tiles640+erfnet | 31/78 | 39.7% | 79.5% | 0/148 | 46.2% |

混合方案相对原方案的召回变化：+37.2 个百分点；按图片配对 bootstrap 5000 次的 95% 区间 [+28.8, +47.1] 个百分点。这是小规模、同域、相关图片的描述性区间，不能支持独立农场结论。ERFNet 像素 IoU：crop 94.4%，weed 60.3%。

## 新确认集的小目标

| GT 最大边长（源像素） | 杂草数 | 整图候选匹配 | 混合候选匹配 | 混合正确识别 |
|---|---:|---:|---:|---:|
| <=32 | 38 | 8 | 11 | 9 |
| 33-64 | 27 | 12 | 15 | 14 |
| 65-128 | 12 | 9 | 9 | 8 |
| >128 | 1 | 1 | 1 | 0 |

## 剩余错误与训练判断

新集错误拆解：`{"no_candidate_match": 42, "correct_weed": 31, "false_positive_unmatched_other": 5, "candidate_present_but_uncertain": 4, "false_positive_weed_localization_iou_0.1_to_0.5": 3, "candidate_present_but_crop": 1}`。这是按标注框几何关系的事后诊断，不是模型内部原因的证明，也没有据此回调参数。若把目前所有已匹配但分类错误的杂草全部分对，分类头在固定候选上的理论额外收益也仅为 6.4 个百分点；没有候选的杂草仍不会被找回。

建议保留农业预训练模型作为糖甜菜域专家，下一轮优先比较真正的农业实例检测/分割基线，处理切片边缘碎片和重复框，并用新的农场/拍摄序列成组留出。新分类头应等到同域定位达标、分类错误确实成为主要瓶颈，再使用独立训练集和新的测试集验证。当前确认集此后属于已查看的诊断数据，不能继续称为未触碰测试集。

## 案例与演示

打开 `evidence-gallery.html` 可切换原图、原方案、混合方案和人工标注，查看相同像素的局部放大。`cases/` 保存真实图片对照，包含恢复成功与剩余失败；图片均在评分后按类别选取，不能替代完整统计。

面向 judge 的真实亮点是：**“General-purpose segmentation misses tiny weeds. We tested a zoomed agricultural pipeline, measured the recovery, and kept every remaining failure visible.”** 具体数字以确认集表格为准。没有训练声明、GPS、机器人动作、跨帧跟踪或除草收益声明；视频继续暂停。

## 预算与复现

本轮请求 288 次，新增估算/保留 $0.8763，共享总估算/保留 $2.5708；1 笔本轮费用未结算，保留原 reservation。不是账单核对金额。没有自动付费重试。离线 ERFNet 推理 API 费用为 0。

`scripts/verify.py` 核对 45 组输入/标注 SHA、确认集不重合、旧 20 张原始指标完全复现，以及重复框和 crop→weed 的计分不变量。`scripts/recognize.py` 是可重复运行的本地 RGB 识别入口，可选同源 SAM 候选；输出语义掩膜、框、标签与来源，不读取标注。

静态图片已逐类检查；案例页内嵌图片与 5×4 种切换路径通过 JavaScript 执行核验。浏览器自动化连接两次超时，未完成浏览器渲染实测；不把它记录为浏览器 QA 通过。

详见 `REPRODUCE.md`、`protocol.json`、`selection.json`、`selection-freeze.json`、`results/comparison.csv`、`results/*/error-analysis.json` 和原始响应。权重 SHA：`06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2`。

## 来源

农业模型与权重：[PRBonn 官方 PhenoBench baselines](https://github.com/PRBonn/phenobench-baselines/tree/main/semantic_segmentation)。数据与标注：[PhenoBench dataset](https://www.phenobench.org/dataset.html)。Weyler et al., “PhenoBench — A Large Dataset and Benchmarks for Semantic Image Interpretation in the Agricultural Domain,” IEEE TPAMI, 2024。数据及衍生图片遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。模型/架构文件仅在本地研究使用；权重和运行环境不打入公开展示包。
