# A.T.H.E.N.A.

独立构建的守望先锋中文人物／组织关系知识库。**使用 Atlas 的有限事实关联输入，不使用其代码、布局、原文或媒体资产。** 中文以本项目术语知识库为准，首批标准译名经国服官网核对。

## 当前可用

- 18 个实体、21 条关系（17 条官方依据核验、4 条待核验）、18 条中文术语（17 条已核对、1 条暂译）。
- 8 组来自 Atlas v5 的显式连接端点；保留 commit、blob、JSON pointer 和原始名称。
- SVG 关系图：中英文／别名搜索、人物／组织筛选、状态／时期／关系类型筛选、一跳聚焦、缩放和平移。
- 点击节点查看档案，点击连线查看关系语义、中文摘要、时期、来源与 Atlas 输入记录。
- 术语库、来源目录和只读待核验队列；未提供伪装成审核的按钮。
- 固定版本导入适配器、基于知识库的关系中文化、跨文件验证、32 项自动化测试。
- 独立静态构建与本地只读 HTTP API。运行无需 API 密钥、数据库或第三方依赖。

这是**首个可运行垂直切片，不是全部 Atlas 的中文版本**。它不含完整英雄生平、自动网络爬虫、生成式翻译服务、账户系统或编辑后台，也未公开部署。最新赛季的全量关系尚未核验。

## 运行

需要 Node.js 22 或更高。没有外部 npm 依赖，不需要 `npm install`。

```sh
git clone https://github.com/MapleOAO/A.T.H.E.N.A.-.git
cd A.T.H.E.N.A.-
npm run validate
npm test
npm run dev
```

访问 `http://127.0.0.1:3000`。可设置 `PORT`。服务仅监听本机，不能直接拿去当公网服务。

```sh
npm run build
```

`dist/` 是完整静态站点，可由任意静态 HTTP 服务托管；支持子目录路径。不要双击 HTML（模块与数据加载需要 HTTP）。**构建不会部署，不使用 Sites，不访问用户服务器。**

## 资料工作流

1. 获取有权读取的 Atlas 数据文件，固定 commit 和 Git blob SHA。
2. `npm run import:atlas -- /path/codex-labels.json <commit-sha> <blob-sha>`：校验原始字节 SHA，仅向 stdout 输出候选报告，不改正式库。
3. 未匹配实体或类型冲突进入 `unresolved`；布局节点和 `edges` 不当成关系事实。
4. 阅读官方来源；在 `sources.json` 记录访问方式、日期、章节和授权边界。
5. 在 `glossary.json` 对齐实体 ID 和国服中文名称；缺少官方名称的保留 `pending`。
6. 写入独立中文关系摘要，保留 `candidateIds`，补齐证据、时期、审核和中文化依据。
7. 验证、测试、构建并通过 Git review 发布数据变更。

```sh
npm run translate -- ana-mother
```

输出 `安娜 — 母亲 → 女儿 — 法老之鹰`，同时返回术语 ID 与版本。此工具只生成受控关系表达，不翻译整段文章、不调用 LLM。复杂摘要仍需依据原文独立编写并核验。

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `data/` | 版本化知识库：实体、关系、来源、术语、候选、元数据 |
| `src/knowledge.mjs` | 校验、查询、名称规范化、受控中文化 |
| `src/atlas-import.mjs` | 独立 Atlas v5 候选适配器 |
| `web/` | 原创中文界面、SVG 关系图 |
| `scripts/` | 只读服务器、构建、导入、校验 CLI |
| `tests/` | Node 内置测试，无外部依赖 |
| `docs/` | 架构、数据治理、模型定义、Agent 交接与验证记录 |

后续 Agent 请先读 [AGENTS.md](AGENTS.md) 和 [交接文档](docs/HANDOFF.md)。

## 界限与署名

Atlas： [DiegoSolanoC/Overwatch-Atlas](https://github.com/DiegoSolanoC/Overwatch-Atlas)。当前样本固定在 `7df0623bf538ef5dedd49e620fc7a6356f5318d2`，Codex blob 为 `c52b9ff73955ca9bf4d5fd1d83a0fd589718df0b`。

本项目不是暴雪官方产品。守望先锋的角色、世界观和商标归相应权利人。公开可读不代表原文和媒体可以任意再分发。未确认 Atlas 标准许可证；本版不镜像其数据集，只保留八组关联端点事实及署名，并对部分关系独立核验。详见 [资料规则](docs/DATA_POLICY.md)。本仓库暂不另行声明开源许可证，后续由所有者选择。
