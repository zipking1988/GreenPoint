# GreenPoint 提交文案事实核对

核对日期：2026 年 11 月 3 日。当前线上产品包含本地 checkout 尚无的真实证据和代理回放；提交包以线上版本及 GitHub main 的已发布记录为依据，不修改本地产品实现。

| 对外表述 | 对应证据与边界 |
| --- | --- |
| 可检查的真实模型候选 | 默认工作区是 Recorded · Sugar beet / Weed review example，7 条候选；来源为真实公开 PhenoBench 图像，推理是已保存的真实 Meta 输出。 |
| 来源框与同源证据 | 当前页面 GP-001 的选中框、裁图和理由来自同一工作区记录。人工选择 Keep for review 后显示 Model: weed · Human deferred。 |
| 地图与视频复核共享决定 | 本次浏览器操作已验证：应用内切到 Video 后 GP-001 保留原始 weed 建议、有效 uncertain 分类与 deferred 状态。 |
| CSV 保留来源与判断 | 本次检查了实际下载的 7 行 CSV：GP-001 的 original_label=weed、label=uncertain、review_status=deferred；同时包含 source、session_id、run_id 和归一化源图坐标。导出副本见 evidence/actual-review-export.csv。 |
| Muse 实际调用 MCP | 已发布 agent trace 包含 greenpoint_capabilities、greenpoint_analyze_frame 两次调用，以及三个 Muse model turns；最终 human_review，证据 IDs 为 GP-001、GP-007。 |
| agent 输出与工作区回放独立 | agent trace 中 GP-001 原始 weed、置信度 0.72、有效 uncertain；工作区对应记录为 weed、0.75。不得跨运行拼接数据。 |
| 模型组合真实使用 | 公开结果标明 sam-3.1、muse-spark-1.3；Muse 既用于候选视觉判读，也用于独立 MCP 软件代理。 |
| 20 张 held-out 图片评测 | 冻结 5 张 development / 20 张 official validation 图片。20 张内找到 3/88 株标注杂草，148/256 株标注植物与检测框匹配，93/158 候选为 uncertain；无失败或截断图片。 |
| 精确率不能泛化 | 3/3 杂草预测正确，只有三个阳性预测。它不是 100% 整体准确率，不能表述为可靠识别或通过田间验证。 |
| 运动视频与追踪 | 两段真实 4 秒 Bonn robot-camera 片段均返回零候选。采样帧候选关联和 native video 接口已实现；运动身份连续性尚未验证。 |
| 日本农户用途 | 目标用户与产品方向。现有公开 UAV/robot 数据不代表日本手机拍摄或农户试验。未测量节省时间、减药或农户使用反馈。 |
| 硬件与地理位置 | 仅源图归一化坐标；未完成 GPS 投影、物理机器人验证、飞行控制、导航或施药。 |

## 公开来源

- [当前工作区](https://greenpoint-vert.vercel.app/dashboard)
- [首页真实证据](https://greenpoint-vert.vercel.app/#evidence)
- [首页 Muse MCP 三步回放](https://greenpoint-vert.vercel.app/#agents)
- [完整评测与局限](https://greenpoint-vert.vercel.app/validation.html)
- [机器可读评测结果](https://greenpoint-vert.vercel.app/validation-summary.json)
- [真实 agent trace](https://greenpoint-vert.vercel.app/assets/verified-run/agent-trace.json)
- [当前 GitHub README](https://github.com/zipking1988/GreenPoint/blob/main/README.md)
- [MCP 和 Muse scouter 说明](https://github.com/zipking1988/GreenPoint/blob/main/landing/docs/MCP.md)
- [已有产品演示和评委问答](https://github.com/zipking1988/GreenPoint/blob/main/landing/docs/DEMO.md)
- [公开数据归属](https://greenpoint-vert.vercel.app/licenses/public-data.md)

## 编写时读取的文件内容版本

这些是 GitHub 内容 blob SHA，不是部署 commit：README `0423fd522ff9ab0d08ea641f4f12ac9743d73b06`；评测 summary `c77617ea054350e3e7275e51f45385e97a254f28`；agent trace `b8e7972ad16a3dfa3e94c756c7d93409b4dcc174`；MCP 文档 `3efe478d70d432787a702c440ea9c54c1c856556`。

## V2 重剪补充

- 当前视频仍使用原线上录屏；GP-001 同源证据镜头改用主录屏 61.9–73.9 秒连续片段。
- Agent 字段说明卡读取公开 `agent-trace.json`，GitHub blob SHA 仍为 `b8e7972ad16a3dfa3e94c756c7d93409b4dcc174`。不展示或导出实际认证凭据。
- MCP 的 `browser_session_sync` 不支持；工作区人工状态不传播到 Agent，提交文案已明确。
- V2 本地材料主题统一为 Build for Your World；没有代为修改或提交官方表单。
- V2 使用已有 Bella 完整句子重剪；原密钥返回 invalid_api_key，没有产生新的语音合成请求。

## 最终版 Bella 补录

2026 年 11 月 3 日，更新后的 ElevenLabs 密钥验证成功，指定音色仍为 Bella / female / american。完成 7 段新版旁白合成并保留 5 段未修改录音；语音原始结果和时间戳均已缓存。最终音轨 180.000 秒，字幕与实际语音重新对齐。线上产品录屏、CSV 与实际 Agent trace 的事实边界未改变。V2 文件已备份保留。

## r4 农业实验剪辑补充

- 新40图结果仅属于本地预训练农业识别分支，不代表线上SAM/Muse精度；持续标注Local research / not deployed。
- 本轮实际重新运行选定识别器，RGB输入14候选（9crop/5weed），0API调用，CPU前向约0.94秒；非上传到结果总耗时。输入SHA、结果和日志位于evidence/agricultural/local-run/。
- 同40图前实验SAM/ERF混合precision76.1%/recall60.2%，本地选定YOLO为96.7%/60.7%，误报37→4；完整196株杂草、343株作物。不是39.7%→60.7%的跨批次比较。
- 固定切片消融87.2%→92.5%precision、63.3%recall；片中的真实包含对照来自06-05_00164_P0037991.png，小框IoS93.4%，保留框GT IoU约0.913。两个框都存在于Before，小框确实从After消失。
- 主整图方法未使用去重；<=32px召回26/70→19/70已保留，独立农场及运动身份未验证。
- 11段r4 Bella美国女声全部新生成；配音180秒，字幕45条，按原始字符时间戳校准。尾段扩展1秒使用缓存录音，没有重复合成。
- 新农业镜头为原始照片和实际输出的剪辑可视化，不是虚构的浏览器界面或实时推理过程；没有补绘植物细节。
