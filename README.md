# A.T.H.E.N.A.

独立构建的守望先锋中文人物／组织关系知识库。使用 Atlas 的事实性目录与显式关联作为输入；代码、布局、中文摘要独立编写。

## 当前版本 v0.2.0

- 172 个实体：固定 Atlas 版本中的 53 位英雄、76 个其他角色、41 个组织，共 170 项完整目录；另有 Talon 和一条未合并的组织异拼记录。
- 57 / 57 条 Atlas 显式关联输入均已覆盖，保留原名、commit、blob 和 JSON pointer。Liao ↔ Echo 双向输入保留两个出处，图中去重。
- 81 条关系：33 条已核验、48 条待核验；10 个资料来源。
- 172 条中文术语：61 条官方用字已核对、111 条工作译名待审。53 位英雄的中文名称均有国服目录依据。
- 搜索、筛选、一跳聚焦、全图缩放与平移、实体和关系详情、证据定位、术语搜索、收录进度、JSON 下载。
- 全部实现无第三方运行时依赖；36 项自动化测试。

**“目录完整”不等于“知识全部核验完成”。** 当前不声称全量剧情、所有时期关系或最新赛季身份已经确认。未审批的工作译名不是官方译名。

## 运行与构建

需要 Node.js 22 或更高，无需 npm install。

```sh
git clone https://github.com/MapleOAO/A.T.H.E.N.A.-.git
cd A.T.H.E.N.A.-
npm run validate
npm test
npm run dev
```

访问 http://127.0.0.1:3000。开发服务器只监听本机，不使用用户服务器或 Sites。

```sh
npm run build
```

- `dist/index.html`：标准静态站点，支持 GitHub Pages 子目录；需 HTTP 服务。
- `dist/preview.html`：单文件离线审阅版，内嵌数据、样式和原创脚本，下载后可直接在浏览器打开。
- `dist/.nojekyll`：GitHub Pages 静态发布标识。

## GitHub Pages

已发布并通过实际浏览器检查：[打开 A.T.H.E.N.A.](https://mapleoao.github.io/A.T.H.E.N.A.-/)。发布文件位于 `gh-pages` 分支根目录。

后续重新配置可在仓库 Settings → Pages 中选择 **Deploy from a branch → gh-pages → /(root) → Save**。每次更新仍需核对线上版本，不能只检查提交成功。

详见 [发布说明](docs/DEPLOYMENT.md)。

## 数据维护

1. 固定 Atlas 的 commit/blob 后，以独立导入器读取事实性端点。
2. 记录未匹配名称、类型冲突和重复输入；不把布局连线或 junction 当作剧情事实。
3. 阅读官方资料，把实体 ID 与 `data/glossary.json` 对齐。
4. 独立概括关系，保存证据章节、时期、审核日期、术语版本和 Atlas 输入血缘。
5. 运行校验、测试、构建后提交。

```sh
npm run import:atlas -- /path/codex-labels.json <commit-sha> <blob-sha>
npm run translate -- ana-mother
```

## 项目结构

| 路径 | 职责 |
| --- | --- |
| data/ | 实体、关系、术语、来源、候选、版本 |
| src/knowledge.mjs | 校验、查询、中文化 |
| src/layout.mjs | 原创确定性图谱布局 |
| src/atlas-import.mjs | Atlas v5 白名单导入适配器 |
| web/ | 中文界面与 SVG 图谱 |
| scripts/ | 开发服务、构建、数据 CLI |
| tests/ | 数据、布局、HTTP 边界测试 |
| docs/ | 架构、资料规则、发布及交接 |

## 来源与界限

Atlas：[DiegoSolanoC/Overwatch-Atlas](https://github.com/DiegoSolanoC/Overwatch-Atlas)。固定 commit `7df0623bf538ef5dedd49e620fc7a6356f5318d2`，Codex blob `c52b9ff73955ca9bf4d5fd1d83a0fd589718df0b`。

只整理事实性名称、类型和显式关联端点；不复制 Atlas 源码、叙述正文、坐标或媒体。本项目不是暴雪官方产品，角色、世界观及商标归相应权利人。未确认 Atlas 标准许可证；不据此扩展为全文或资产再分发授权。仓库暂不另行声明许可证。

后续 Agent 请先读 [AGENTS.md](AGENTS.md) 与 [HANDOFF](docs/HANDOFF.md)。
