# 数据契约 v1

运行时约束以 `src/knowledge.mjs::validateKnowledge` 为准；它同时用于 CLI、服务器启动、构建及浏览器加载。不是已经接入的 JSON Schema 引擎。

| 对象 | 关键字段 | 规则 |
| --- | --- | --- |
| metadata | schemaVersion, version, glossaryVersion, asOf, atlasVersion | 当前 schemaVersion=1 |
| entity | id, name, kind, cluster | kind=person/organization；cluster 仅排版 |
| glossary | id, entityId, en, zh, locale, aliases, status, sourceIds, locator, reviewedAt | 每个实体恰好一条；approved 必须有已读官方依据 |
| source | id, title, url, kind, language, read, accessMethod, accessedAt, locator, rights | HTTPS，无 URL 凭据；kind=official/community |
| candidate | id, from, to, originalNames, sourceId, pointer, commit, blob, status | 固定上游版本；不得指向缺失实体 |
| relation | id, from, to, predicate, period, status, summaryZh, evidence, candidateIds, translation, review | 有类型约束、有向；friend/related 对称 |
| evidence | sourceId, locator, noteZh | 主张级证据，不仅一个页面链接 |
| translation | method, glossaryVersion, termIds | verified 必须按端点顺序对应两条术语 |
| review | reviewer, date, scope | 不冒充人类审核；日期为核验日期非故事发生日期 |

`founder/member/leader`：person → organization。`branch`：organization → organization。`rescued`：person 或 organization → person。其他受控谓词约束见源码。

`mother` 方向为母亲 → 女儿；`brother` 为兄长 → 弟弟；`mentor` 为导师 → 学生；`answered` 为响应者 → 发出召唤者。反向浏览不创建第二条重复事实。

去重键：端点 + 谓词 + 时期；对称关系排序端点后去重。不同时间或不同含义可以共存。

新增 verified 关系必须同时满足：实体存在、谓词端点类型有效、官方来源已读、至少一条具体证据、审核记录、中文术语批准、术语版本一致，以及候选引用端点一致。程序校验不能代替来源语义审阅。

## 实体图像

entity.visual.kind 为 official-portrait 或 name-icon。official-portrait 需要已读取的官方 sourceId、sourcePage、checkedAt、rights 和HTTPS url；当前允许图源域名 ld5.res.netease.com。name-icon 为本站名称占位图，status=pending，不作为角色真实外观或官方组织标志。

新增谓词 protected（保护）、cared-for（照料）、fought（曾交战，对称）、attempted-capture（试图劫走）、guarded（看守/收容）、gifted（赠予装备）均只表达具体章节的事实。
