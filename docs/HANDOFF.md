# 当前接手状态：v0.7.0（2026-09-18）

用户要求原创代码、Atlas资料输入、自有中文知识库、所有人物与组织可靠配图；已授权发布GitHub Pages，不使用Sites或用户服务器，不清空仓库。

- 172实体；323关系：283 verified / 40 pending。
- 118 approved术语 / 54 pending；84 sources。
- 87官方图像：53头像、17剧情配图、2阵营标志、15漫画局部；88缺图。
- 原先npc-media-kiriko研究已接入（shimada-clan建议ID映射为现有shimada）；鲍勃换成更清晰的官方双人场景。
- 本轮英雄资料与PDF来源审计在docs/research，准确缺口在docs/REMAINING.md；不能报告“全部补齐”。
- 43项测试、数据校验、静态构建通过。发布及浏览器最新结果见DEPLOYMENT.md与VERIFY.md。
- 前端新增时期reign与图像目录、原图局部展示。官方CDN图片保持外链，漫画局部保存在本地；没有生成或复制Atlas资产。
- 60个官方目录旧PDF链接返回403，不可当作已读；15份下载成功，其中实际引用的作品有来源记录和页码。成功下载但未读的作品也不能自动核验。
- 当前依旧保留Talon Empire/Talon、Colosseo/Colloseo、Ming/Myung的消歧边界。肯德拉两种官方姓氏保留，不编造原因。
- main保存源码，gh-pages只保存构建产物。更新快进，不force push；线上版本要实际检查。

## 固定上游

Atlas commit 7df0623bf538ef5dedd49e620fc7a6356f5318d2；blob c52b9ff73955ca9bf4d5fd1d83a0fd589718df0b。170目录节点（53hero/76npc/41faction），57显式connections。1046junction和1430布局edges不是剧情。

## v0.5 接续重点

- 新增官方英文漫画/短篇资料；准确阅读范围与未读下载在research/2026-09-18-official-comics-excerpts.json。旧国服PDF失败不等于全球版本无法读取。
- 7张小幅PDF人物/建筑局部位于web/assets/portraits；official-excerpt单独标注，SHA-256和提取区域写入visual.extraction。不得将整份漫画放入发布目录。
- build校验本地图像哈希并内嵌于preview；服务支持JPEG；源码和发布分支都需要上传二进制blob。
- 剩余40关系/54译名/88图像，未宣布全齐。Ming不因朱诺父亲Minh的近似拼写自动合并。

## v0.6 接续重点

- 84图像/88缺图，279已核验关系/40待核验，118已核对译名/54待核对。
- researchNote为可选实体字段，包含summaryZh/sourceId/locator/reviewedAt；校验必须有已读官方来源，详情首部显示。
- 新阅读范围：Searching第3–6页，Masquerade第4–12页，London Calling 1第5–21页；国服新闻PDF全部6页，英文全部7页。不同语言页码不可混用。
- 新审计：research/2026-09-18-comics-identity-audit.json。不能宣称全部补齐。

## v0.7 接续重点

- 87官方图像／85缺图，283已核验关系／40待核验；118已核对译名／54待核对。
- 新增Kace、泰哈撒孟达塔、明队长3张漫画局部；Kace中文名仍待审。
- 新血5第3–8、19–20页与伦敦呼唤2第3–8、12–15页为本轮实际阅读范围；其他页面不自动视为已读。
- MEKA整体未据此判定加入守望先锋；实体详情注明D.VA获派、其余成员留守。
- 新增4条关系及1条旧关系补证；新审计在research/2026-09-18-new-blood-london-audit.json。
- 后续优先审阅New Blood 4、Going Legit和London Calling后续页；所有未明姓名的画面继续暂缓采用。
