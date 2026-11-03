# GreenPoint 提交材料与三分钟演示片

最新版：r4 Agricultural Evidence，2026-11-03。新版用真实模型对照替换重复清单镜头：23px判断分歧、一次完整复核与导出、Muse工具调用、本地农业识别、同图评测、碎片去重与剩余失败。

公开发布入口见 [PUBLICATION.md](PUBLICATION.md)：[三分钟演示](https://greenpoint-vert.vercel.app/demo.html)、[公开源码](https://github.com/zipking1988/GreenPoint)、[农业实验证据](https://greenpoint-vert.vercel.app/agricultural-research.html)、[完整视频编辑包](https://github.com/zipking1988/GreenPoint/releases/tag/hackathon-2026-11-03)。GitHub 源码目录不包含音频、录屏和模型权重；视频重建素材在完整编辑包中。原创代码采用经用户确认的 MIT 许可，第三方材料保留原许可。

## 成片

[最终 MP4](video/GreenPoint-Hackathon-Demo-3min-final.mp4) · [英文字幕](video/GreenPoint-Hackathon-Demo-final-en.srt) · [封面](video/GreenPoint-Hackathon-Demo-poster.jpg)

精确03:00，1920×1080，30fps，H.264/AAC。32个剪辑镜头，11段新生成的ElevenLabs Bella美国女声，331个英文词、45条按真实字符时间戳生成的烧录字幕。另附SRT；视频中没有重复的内嵌字幕轨。

[检查报告](video/qa-report.json) · [上传标题和说明](video/upload-description.txt) · [完整分镜](demo-script.md) · [旁白](voiceover.txt)

| 时间 | 内容 |
|---|---|
| 00:00–00:10 | 同一23px植物：前实验crop、公开标注weed、新检测器weed |
| 00:10–00:24 | 线上Meta复核流程与SAM/Muse职责 |
| 00:24–01:01 | 同源证据、一次人工复核、跨视图状态与真实CSV |
| 01:01–01:22 | 实际Muse → MCP工具调用与human_review |
| 01:22–01:57 | 实际本地CPU输出、51px定位恢复与标注对照 |
| 01:57–02:31 | 20校准/40确认、同图精确率与误报、真实碎片去重 |
| 02:31–02:47 | 小目标退步、公开数据与运动验证边界 |
| 02:47–03:00 | 线上/本地状态和下一步、产品收束 |

## 核心事实

线上画面来自此前真实生产录屏，推理结果保留Recorded real Meta run标识。农业段是实际本地识别结果与数据可视化，持续标注Local research / not deployed；没有伪造网页、推理进度或植物细节。

新40图同图对照：前实验混合方案precision76.1%、recall60.2%，新选定整图YOLOv7为96.7%/60.7%，误报37→4。固定切片消融precision87.2%→92.5%、recall63.3%；主选定方法本身不用切片去重。<=32px仍由26/70降到19/70，已在片中明确保留。

这些是同一公开糖甜菜域上的确认集点估计，不是独立农场验证。农业权重由作者预训练，未由GreenPoint训练，也不是Meta模型；农业分支尚未接入线上。工作区和Muse trace是两次独立推理，不混用候选数据。坐标是源图坐标，没有GPS、硬件动作或已验证运动跟踪。

[研究报告](evidence/agricultural/REPORT.md) · [完整结果](evidence/agricultural/results/comparison.csv) · [实际本地运行](evidence/agricultural/local-run/recognition.json) · [事实核对](fact-check.md)

## 三段英文提交文案

[项目描述](01-project-description.txt) · [Meta使用说明](02-meta-products.txt) · [Meta重要性](03-why-meta.txt) · [合并复制版](submission-copy.md)

已同步区分线上Meta能力和本地农业研究。赛道Indie Developer，主题Build for Your World。

## 重建与声音

在包含此submission目录的工作区根目录运行：

```sh
python3 submission/render_demo_video.py
python3 submission/verify_recognition_video.py
python3 submission/package_submission.py
```

render_demo_video.py按当前storyboard自动转到新版render_recognition_video.py。重建使用包内真实录屏、公开研究照片、JSON结果、原始录音与字体，不访问模型API，不需要下载模型权重。依赖Python、FFmpeg、NumPy、Pillow、fontTools。prepare_recognition_revision.py仅在完整实验工作区刷新研究证据时使用，不是离线重建视频的前置步骤。

[完整MP3](audio/greenpoint-narration-180s.mp3) · [WAV](audio/greenpoint-narration-180s.wav) · [声音与时长记录](audio/manifest.json)

本轮新密钥已验证Bella的female/american标签；11段新语音全部缓存。尾段时长调整复用已有缓存，没有重复合成。凭据仅在忽略的本地.env.local中，提交包不含密钥。

旧成片、旧旁白、分镜和制作脚本保存在本机video/versions/pre-recognition-20261103/，未丢失。提交包包含当前成片及编辑所需素材，不包含旧版本备份或农业模型权重。

## 提交

使用[官方表单](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)，填写真实成员与授权项，并提供评委可访问的视频、仓库和演示链接。公开材料发布与官方表单提交是两个步骤；只有主办方确认回执才能证明正式提交成功。
