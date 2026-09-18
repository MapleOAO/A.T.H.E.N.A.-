# 当前接手状态：v0.4.0（2026-09-18）

用户要求原创代码、Atlas资料输入、自有中文知识库、所有人物与组织可靠配图；已授权发布GitHub Pages，不使用Sites或用户服务器，不清空仓库。

- 172实体；302关系：260 verified / 42 pending。
- 117 approved术语 / 55 pending；70 sources。
- 70官方图像：53头像、15剧情配图、2阵营标志；102缺图。
- 原先npc-media-kiriko研究已接入（shimada-clan建议ID映射为现有shimada）；鲍勃换成更清晰的官方双人场景。
- 本轮英雄资料与PDF来源审计在docs/research，准确缺口在docs/REMAINING.md；不能报告“全部补齐”。
- 39项测试、数据校验、静态构建通过。发布及浏览器最新结果见DEPLOYMENT.md与VERIFY.md。
- 前端新增时期reign与图像目录、原图局部展示。所有原始图源保持外链，没有生成或复制Atlas资产。
- 60个官方目录旧PDF链接返回403，不可当作已读；15份下载成功，其中实际引用的作品有来源记录和页码。成功下载但未读的作品也不能自动核验。
- 当前依旧保留Talon Empire/Talon、Colosseo/Colloseo、Ming/Myung的消歧边界。肯德拉两种官方姓氏保留，不编造原因。
- main保存源码，gh-pages只保存构建产物。更新快进，不force push；线上版本要实际检查。

## 固定上游

Atlas commit 7df0623bf538ef5dedd49e620fc7a6356f5318d2；blob c52b9ff73955ca9bf4d5fd1d83a0fd589718df0b。170目录节点（53hero/76npc/41faction），57显式connections。1046junction和1430布局edges不是剧情。
