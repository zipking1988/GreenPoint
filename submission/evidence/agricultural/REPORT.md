# Agricultural instance localization — 2026-11-03

## 结论

冻结方法：`{"model": "yolo", "geometry": "whole", "weed_threshold": 0.83, "nms_iou": 0.5, "dedup": "none", "expert_min_weed_fraction": 0.0, "box_refinement": "none"}`。新 40 张确认图片共有 196 株杂草、343 株作物；正确识别 119 株杂草，预测 123 个 weed，召回 **60.7%**、精确率 **96.7%**、匹配作物误判为 weed **0/343**。原定 90% precision / 60% recall / crop-as-weed≤5% 的完整门槛：**通过（本公开确认集的点估计）**。

同图、同口径对比上一轮冻结的 SAM＋四切片＋ERFNet：118/196，召回 60.2%、精确率 76.1%。以下表格始终覆盖完整 40 张图片。

本次主要收益是降低误报：上一轮混合方法 37 个 weed 误报降到 4 个，而正确杂草数仅从 118 增至 119。不能将上一轮另一批 20 张图片的 39.7% 召回，与本轮 60.7% 直接当作同图因果提升。

**小目标存在取舍：≤32px 的70株杂草，前方案找回26株，selected仅19株；切片＋包含去重为21株，仍低于前方案。** 33–64px 从51株提高到58株。整体门槛通过，并不代表最小目标已解决；演示和产品都必须保留这一短板与人工复核。

| 方法 | 正确杂草 / 全部 | 召回率 | 精确率 | 作物→杂草 |
|---|---:|---:|---:|---:|
| previous_whole | 89/196 | 45.4% | 87.3% | 0/343 |
| previous_hybrid | 118/196 | 60.2% | 76.1% | 0/343 |
| official_yolo | 153/196 | 78.1% | 68.3% | 7/343 |
| calibrated_yolo | 119/196 | 60.7% | 96.7% | 0/343 |
| selected | 119/196 | 60.7% | 96.7% | 0/343 |
| without_dedup | 119/196 | 60.7% | 96.7% | 0/343 |
| without_tiles | 119/196 | 60.7% | 96.7% | 0/343 |
| without_refinement | 119/196 | 60.7% | 96.7% | 0/343 |
| tiles_nms_only | 123/196 | 62.8% | 87.2% | 0/343 |
| tiles_containment | 124/196 | 63.3% | 92.5% | 0/343 |
| official_faster | 136/196 | 69.4% | 66.7% | 13/343 |
| calibrated_faster | 132/196 | 67.3% | 76.3% | 1/343 |

## 方法与真实取舍

实际运行官方农业预训练 YOLOv7 与 Faster R-CNN。权重来自 PhenoBench 作者；没有训练新模型、分类头或 LoRA。YOLOv7 使用固定上游 commit 的推理定义与受限 weights-only 加载；Faster R-CNN 用 torchvision 的相同 ResNet50-FPN 架构严格加载官方 state_dict。均为 FP32 CPU 推理，只有 RGB 输入。

分别测试整图、多尺度（整图＋4 个640px切片，偏移0/384，放大到1024）、NMS、内部切片边缘惩罚、同类小框被大框覆盖≥90%的包含去重、ERFNet weed 验证、语义连通域边界修正。参数只由 20 张校准图决定。模型默认阈值与校准阈值分开报告，所有失败校准阶段及完整网格保留。最终候选是上表 `selected`，不得从确认集事后挑另一个方法当赢家。

原始 YOLO 默认 whole-frame 阈值0.25、NMS0.65；官方 Faster R-CNN 对照阈值0.6、NMS0.5（相同预测缓存上的推理适配，非官方原环境逐位复现）。缓存使用低分阈值0.01和高NMS0.95保存候选，再应用明确后处理；每视图上限1000保留并记录 limited。当前 selected 配置若为整图/无去重，即说明复杂流程没有在校准集胜出，不能宣称切片或去重带来了最终提升。

## 数据与验收

20 张校准＋40 张确认图，均为新选官方 val 图片，排除原 45 张及 smoke 图。按 SHA256(instance-localization-v2-20261103:filename) 固定抽样，模型运行前保存清单；RGB、语义和实例标注分别校验 ZIP CRC、字节数与 SHA。20 张用来反复校准；40 张不参与参数和模型选择，选择 SHA 在候选确认推理前冻结。旧 40 张已查看的验证图片没有用于本轮选择。

仍是同一个公开糖甜菜域；作者可能曾以官方 val 选择 checkpoint。图片不重合不等于独立农场、独立拍摄序列或日本手机场景验证。所有 partial、边缘植物、小目标与失败主对照请求保留。计分与上一轮完全相同：class-agnostic、greedy、one-to-one box IoU≥0.5；uncertain 不算正确识别，碎片和重复框计为误报。

## 小目标

| GT 最大边长 | 杂草数 | 上轮混合正确识别 | 本轮 selected 正确识别 |
|---|---:|---:|---:|
| <=32px | 70 | 26 | 19 |
| 33-64px | 74 | 51 | 58 |
| 65-128px | 39 | 29 | 31 |
| >128px | 13 | 12 | 11 |

## 剩余错误和案例

`{"no_candidate_match": 75, "correct_weed": 119, "fp_unmatched_other": 3, "candidate_present_but_crop": 2, "fp_duplicate": 1}`。此为基于标注框的事后诊断，没有拿来重新调参。`cases/` 与交互 `evidence-gallery.html` 展示同一源图的原始像素、标注、前方案和新检测器，包含成功与失败。案例为评分后选取，不能替代全量统计。图片仅做最近邻放大，不补绘或生成细节。

`results/bootstrap.json` 包含5000次图片级bootstrap区间；40张同域图片的小样本相关性限制仍然存在。达标只指该确认集上的观测门槛，不代表置信区间下界过线或现场部署可靠。

## 预算与运行状态

本轮新增估算/保留 $2.1179，共享合计 $4.6887，14 笔本轮 reservation 未结算；这是估算/保留额，不是账单核对金额。农业模型本地推理无 API 费用。新实验 $8 停止、总额 $10 与 $2 回归预留规则保持。

可选的新 Muse 对照遇到多次 provider_error，已停止追加分类调用并保留失败及未知费用 reservation；没有付费自动重试。其不完整图片集不展示为完整方法。主比较 previous_whole / previous_hybrid 使用完整40张实际SAM响应＋同源ERFNet，完整计入失败。

本轮产物是可运行研究原型及证据，尚未替换线上服务。`scripts/recognize.py --image <1024px-RGB> --output <目录>` 可真实本地推理并导出框、类别、来源和耗时，不读取标注。视频文件在本轮实验阶段未改动；可以进入接入产品与新演示验证阶段，不能把研究原型讲成已部署功能。

## 来源与复现

[官方农业模型与权重](https://github.com/PRBonn/phenobench-baselines/tree/main/plant_detection)，[YOLOv7固定commit](https://github.com/WongKinYiu/yolov7/tree/84932d70fb9e2932d0a70e4a1f02a1d6dd1dd6ca)，[PhenoBench数据](https://www.phenobench.org/dataset.html)。Weyler et al., PhenoBench, IEEE TPAMI 2024 / University of Bonn；数据及衍生图片遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。原YOLOv7代码许可保留于 vendor/upstream/LICENSE.md。权重及运行环境不放入公开证据包。

完整结果、输入清单、参数选择历史、冻结SHA、模型SHA、原始推理响应和独立核验脚本均保留；详见 REPRODUCE.md。
