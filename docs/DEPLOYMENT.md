# GitHub Pages 发布

仓库：MapleOAO/A.T.H.E.N.A.-。用户明确授权发布 GitHub Pages，不使用 Sites 或用户服务器。

## 发布结构

main 保留源代码与资料；gh-pages 分支根目录保存 npm run build 产物：
index.html、app.mjs、style.css、favicon.svg、src/、data/knowledge.json、preview.html、.nojekyll。

首次启用：仓库 Settings → Pages → Build and deployment → Deploy from a branch → gh-pages → /(root) → Save。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 本轮状态

源代码、发布分支及线上可达性将在提交后核对。当前不宣称已上线。
现有 GitHub 连接可提交代码，但没有 Pages 设置接口。登录浏览器接管失败，需要仓库所有者在正常浏览器启用首次发布设置；不需要给助手发送密码或令牌。

## 后续更新

运行 validate / test / build 后，仅用 dist 产物更新现有 gh-pages 分支，基于现有提交快进，不 force push。保留 main 历史。
每次核对 Pages 部署结果及线上知识库版本，不能只凭分支提交成功报告部署成功。

preview.html 是不依赖托管的离线审阅版；下载后可直接打开。
