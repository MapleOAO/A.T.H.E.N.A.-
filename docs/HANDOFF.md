# 下一位 Agent 从这里开始

用户要求原创代码、使用 Atlas 资料、中文来自本项目知识库，不使用 Sites、不使用用户服务器、不清空仓库。用户已明确授权发布 GitHub Pages。

## v0.3.0 已完成

- 固定 Atlas v5 的 170 个实体目录节点全部收录：53 hero / 76 npc / 41 faction。另有 Talon 和 Colloseo 异拼条目，共 172 实体。
- 57 条 connections 的输入出处全部保存；其中 Liao/Echo 的双向输入归于同一条图关系。
- 105 条关系（58 verified / 47 pending），172 术语（67 approved / 105 pending），13 来源。
- 新读取国服回声、布丽吉塔、雾子传记，增加创造、帮助脱困、父女、教父、侍从与师徒等有证据关系。
- Hashimoto 按雾子国服正文核对为“桥元家族”；Asa 为“朝”。
- 原创组件分组环形布局、默认一跳聚焦、完整目录索引、术语搜索、覆盖率界面、实体来源定位。
- 37 项测试通过，校验与静态构建通过。构建包含独立离线 preview.html 和 Pages .nojekyll。

## 固定来源

Atlas commit 7df0623bf538ef5dedd49e620fc7a6356f5318d2；blob c52b9ff73955ca9bf4d5fd1d83a0fd589718df0b。1216 nodes 含 1046 junction，不是 1216 个角色。不得推导 1430 条布局 edges 的剧情意义。

## 必须保留的限制

- 目录覆盖完成，证据与译名审核未全部完成。不得把 pending 自动批准或声称完整世界观已经核验。
- Colosseo Gladiatori（nodes）与 Colloseo Gladiatori（connections）仍为两条实体，等待命名消歧依据；Talon Empire 与 Talon 同样分开。
- 当前工作译名中含音译、意译和保留原文，状态明确为 pending。
- 没有后台编辑、账户、自动抓取、生成式翻译或完整时间线。
- GitHub Pages 已实际打开：https://mapleoao.github.io/A.T.H.E.N.A.-/。桌面截图及主要交互已检查，详见 VERIFY.md；窄屏与拖拽尚未验收。
- 用户报告登录接管标签页 Failed to fetch，但创建 gh-pages 后网站实际成功上线；不要再要求用户在失效接管页登录。
- 后续更新仍需单独检查线上版本，见 DEPLOYMENT.md。

## 下一步

1. 根据 DEPLOYMENT.md 的实际发布状态检查 Pages，不重复创建发布分支或覆盖新提交。
2. 可从 gh-pages 或本地构建下载 preview.html 先审阅界面；完成 VERIFY.md 实际浏览器清单。
3. 逐条解决 47 条关系及 105 条译名的证据欠缺；依据官方实际正文，不凭记忆批准。
4. 审核新增事实时更新来源与术语，并保持 Atlas 原始输入定位不变。

## v0.3 图像与新增来源

- 国服英雄目录53张卡片图片按可见名称与链接对应实体，不猜测图片URL。entities.visual记录官方来源、CDN、日期及权利说明；119项名称图标明确为占位，不是官方标志。
- 官方头像使用 ld5.res.netease.com 外链，加载失败回退名称图标；本地CSP只额外允许该图源。离线预览数据可用，但头像需要网络。
- 新增艾什、法老之鹰、奥丽莎传记，补读回声“守望先锋”章节。卡西迪保护廖博士解决一个Atlas待审关联，另增24条具体关系。
- 仍需搜集组织标志与NPC官方肖像，不要把官方技能图标直接冒称头像，不生成虚构角色长相。
