# GitHub Pages 发布

仓库：MapleOAO/A.T.H.E.N.A.-。用户明确授权发布 GitHub Pages，不使用 Sites 或用户服务器。

## 发布结构

main 保留源代码与资料；gh-pages 分支根目录保存 npm run build 产物：
index.html、app.mjs、style.css、favicon.svg、src/、data/knowledge.json、preview.html、.nojekyll。

首次启用：仓库 Settings → Pages → Build and deployment → Deploy from a branch → gh-pages → /(root) → Save。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 本轮状态

已上线：https://mapleoao.github.io/A.T.H.E.N.A.-/

- 源码提交：c1f6f66ed918b9fc02e80fd5e311f82dd1f0a7b6。
- gh-pages 构建提交：c63151647d7b9f38af550ce50f69a7659ce70cd7。
- 2026-09-18 使用实际浏览器打开该网址，确认 v0.2 / 172实体 / 33已核验 / 48待核验，并操作了搜索、详情、筛选、缩放和五个导航。
- 没有发现来自站点域名的控制台错误；浏览器扩展的一条 metadata 错误与应用脚本无关。

之前的登录接管失败未影响此次分支发布。未修改或核实仓库管理界面的 Pages 设置；创建 gh-pages 后，实际网址已成功服务构建产物。无需继续要求用户登录失效接管页。

## 后续更新

运行 validate / test / build 后，仅用 dist 产物更新现有 gh-pages 分支，基于现有提交快进，不 force push。保留 main 历史。
每次核对 Pages 部署结果及线上知识库版本，不能只凭分支提交成功报告部署成功。

preview.html 是不依赖托管的离线审阅版；下载后可直接打开。
