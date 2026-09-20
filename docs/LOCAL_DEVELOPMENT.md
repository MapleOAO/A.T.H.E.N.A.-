# 本地开发与迁移交接

迁移日期：2026-09-20。应用版本保持 v0.10.2；本次只补充交接资料。

## 从零启动

安装 Git 与 Node.js 22 或更高版本（本次验收使用 Node.js 24）。没有第三方 npm 依赖，不需要 npm install、API key、数据库、云端账号或本对话环境。

```sh
git clone https://github.com/MapleOAO/A.T.H.E.N.A.-.git
cd A.T.H.E.N.A.-
node --version
npm run validate
npm test
npm run build
npm run dev
```

打开 http://127.0.0.1:3000，Ctrl+C 停止服务。不要直接打开 web/index.html 或 dist/index.html；它们需要 HTTP。双击 dist/preview.html 可查看单文件审阅版。

服务器启动时加载 data/；修改 JSON 后需要重启 npm run dev。修改 web/、src/ 后刷新浏览器。没有热更新或文件监听器。端口冲突时，macOS/Linux 使用 `PORT=3001 npm run dev`；PowerShell 先执行 `$env:PORT="3001"`，再执行 `npm run dev`。不要只创建 .env，当前程序不会自动加载它。

## 已在 Git 中的交付物

| 路径 | 内容 |
| --- | --- |
| data/ | 177实体、361关系、术语、候选、98来源、版本与精确证据定位 |
| src/、web/ | 原创图谱、查询与中文界面 |
| web/assets/portraits/ | 26张经哈希核验的原作局部JPEG |
| scripts/、tests/、package.json | 开发服务、校验、构建、图像复现、导入及47项测试 |
| docs/research/ | 已读范围、独立摘要、身份依据、暂缓判断、访问失败记录 |
| docs/REMAINING.md | 剩余77图像、54中文名、39关系的工作清单 |
| docs/DATA_MODEL.md、DATA_POLICY.md、ARCHITECTURE.md | 模型、证据要求及设计决定 |
| docs/HANDOFF.md、VERIFY.md、DEPLOYMENT.md | 版本接续、验收与发布记录 |
| AGENTS.md、README.md、CHANGELOG.md | Agent规则、项目入口、变更历史 |

main 是开发分支；gh-pages 保存已上线的静态产物。dist/ 是可重建输出，按 .gitignore 排除，无需从本对话拷贝。仓库没有尚待迁移的数据库或服务端状态。

## 图像与研究缓存

100项图像中26张原作局部已经随源码提交，其余74项（53英雄头像、19剧情配图、2组织标志）引用官方CDN，显示时需要联网；失效时回退名称图标。当前交付不等于所有图片离线可用。

22份本轮工作区PDF缓存的文件名、字节数、SHA-256及既有来源/研究记录入口，已保存为 [原作缓存清单](research/2026-09-20-local-source-manifest.json)。这不是全部历史来源的下载列表；完整来源目录以 data/sources.json 为准。

完整PDF、原文提取、整页渲染与官网全文属于可重新获取的原作缓存，不上传公开仓库；已确认结论及未采用理由保存在研究记录中。临时 update*.py 等一次性数据补丁已经执行，结果已进入 data/ 和研究记录，不应在本地重复运行。正式可复用工具在 scripts/。

继续阅读时从来源记录中的官方链接下载到被忽略的 tmp/，核对SHA-256及语言，再按已读页码继续。来源已变化或不可访问时保留原记录，不把重新下载成功当作已读。Python可跨平台核对：

```sh
python -c "import hashlib,pathlib; print(hashlib.sha256(pathlib.Path('tmp/source.pdf').read_bytes()).hexdigest())"
```

现有头像不需要重新渲染。确需复现时，另外安装 Poppler，确保 pdftoppm 在 PATH 中，然后执行：

```sh
node scripts/render-excerpt.mjs bruce tmp/wasted-land.pdf
```

脚本检查源PDF和输出JPEG哈希；不同版本渲染器可能产生不同字节，不得为通过检查直接替换哈希，需目视复核并记录新的提取依据。

## 下一位开发者／AI的入口

先读 AGENTS.md → README.md → docs/ARCHITECTURE.md → docs/DATA_POLICY.md → docs/HANDOFF.md；本地运行参考本文。继续研究时先读 docs/REMAINING.md 和 docs/research/README.md，复用既有审计，避免重搜已读作品。

目前全部53英雄的官方中文名已有依据；待核对项保持 pending，不凭近似拼写合并实体，不把未具名角色截图作为目标头像。Atlas固定输入170实体、57显式关联与血缘信息仍完整保留；独立扩充不得伪造Atlas出处。

数据编辑后执行 validate、test、build，并更新交接与变更记录。资料继续扩充优先围绕缺口，勿将已下载但未读的章节自动升级为证据。当前没有自动爬虫、LLM服务或数据库。

## 提交与发布

本地按自己的 GitHub SSH/HTTPS 登录方式配置 Git。普通开发提交到 main；推送 main 不会自动更新现有 gh-pages 网站。仅在准备发布时运行校验与构建，将完整 dist/ 内容同步到基于现有 gh-pages 的独立工作树（保留 .git，移除旧构建遗留文件），审查差异、提交并普通快进推送；不要 force push。详见 DEPLOYMENT.md，并检查 Pages 运行和实际页面。

本次迁移只更新 main 文档，线上仍为已验收的 v0.10.2。

## 迁移验收

2026-09-20：validate、47项测试和build通过；额外仅导出Git跟踪的81个文件到全新目录，数据校验、静态构建和真实开发服务HTTP健康接口均通过（v0.10.2）。本次没有改动UI，未重复浏览器视觉验收。
