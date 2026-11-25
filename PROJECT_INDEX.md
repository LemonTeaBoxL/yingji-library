# 项目索引

当前版本 0.4.15，2026-11-25 更新。先用本索引定位，仅按需读取相应源码片段与完整约定。索引不是文件内容的替代；相关实现变更后同步更新。

| 功能 | 主要文件 | 定位重点 |
|---|---|---|
| 项目界面截图 | docs/screenshots/README.md；docs/screenshots/*.png；README.md | 用户提供的 0.4.14 原始截图，首页重点预览及完整 7 图说明 |
| Git 与历史归档 | README.md；docs/GITHUB.md；.gitignore；历史版本/README.md；历史版本/目录.json | 旧版文件按版本归档，源码提交 Git，最新程序通过 Release 发布 |
| 程序入口/通信 | main.cjs；preload.cjs | 主进程 handlers、renderer invoke、独立测试目录 |
| 发现作品载入 | dist/catalog-loading.js；dist/usability.js | loadCatalog/loadMoreMasonry、footer、自动观察；加载模块最后覆盖旧逻辑 |
| 源网页/缓存 | lib/bangumi-browser.cjs；lib/catalog.cjs；lib/catalog-request.cjs | options/browserUrl/browserRows/parseBrowser、browser:3 缓存、cached、readResponse |
| 书籍/音乐数据源 | lib/bangumi-browser.cjs；lib/catalog.cjs；lib/catalog-filters.cjs；dist/features.js | book/music 网页路径、API type 1/3、分类元数据、形式禁用及 TMDB 兼容 |
| 筛选/源站排序 | dist/features.js；dist/source-order.js；dist/workspace-ui.js | quarter/region、网站拉取方式、搜索旁路及记忆 |
| 返回发现页保留 | dist/discovery-session.js | capture/signature/navigate/DOM 与滚动恢复 |
| 个人库连续滚动 | dist/usability.js；dist/usability.css | watchLibraryMore、library-more-sentinel、40 条分批、布局后观察与导航 epoch |
| 个人库/标记状态 | dist/marking.js；dist/marking-ui.js；dist/desktop.js | visibleIds、全部/看过/待看/在看与筛选联动 |
| 分类/个人封面 | dist/categories.js；dist/entry-customization.js；lib/entry-cover.cjs | 统一分类、小说→书籍兼容、手动封面右键、独立副本与 coverOnly 隔离 |
| 数据写入/导入 | lib/library-service.cjs；lib/portable-store.cjs；lib/managed-imports.cjs；state-worker.cjs | 明文索引、独立素材副本、增量保存 |
| 删除/清空/恢复标记 | lib/storage-main.cjs；lib/unmark-entry.cjs；lib/safe-purge.cjs；dist/unmark.js | 确认、独占锁、受控删除、共享与源文件保护 |
| 个人空间/素材 | dist/library-vault.js；dist/refinements.js；dist/gallery-layout.js | 草稿、框选、原比例素材墙、预览 |
| 集数进度 | dist/episode-progress.js；dist/features.js | 批量进度、单集覆盖、评分与评论 |
| 外观/窗口/动效 | src/rdev-glass.jsx；src/optical-map.js；dist/native-glass.js；dist/motion.js；lib/window-material.cjs | 应用内折射与系统桌面磨砂分工；前景与材质分层 |
| Chrome 登录 | lib/chrome-login.cjs；lib/catalog-login.cjs；dist/chrome-login.js；browser-extension/popup.js | 所选站点 Cookie、一次性本机配对、图片预览 |
| 服务器/缓存空间 | lib/webdav-library.cjs；lib/cache-manager.cjs；lib/v04-main.cjs | 手动 WebDAV 快照、受控缓存及后台缓存 |
| 数据库/视频/AI | database-worker.cjs；lib/database-query.cjs；scripts/ai-bridge.cjs | 只读分页、主进程视频处理、AI 只读接口 |

## 读取与验证

- 先使用当前上下文、已有检查报告与本索引，再用 rg 在选定文件查符号；不重复通读 AGENTS 历史或扫描 work/node_modules/releases。
- 浏览器脚本按 dist/index.html 顺序逐层覆盖；features/desktop 中同名函数未必为最终执行版本。先查后加载的模块。
- 通用检查：npm run check；当前 77 项。载入针对检查：work/verify-loading0412.cjs（加 --packed 检查发行资源），20 项。通用界面：work/verify-v0412.cjs，96 项；按风险选择，不机械重复全跑。
- 本次解析/缓存检查：tests/source-order.test.cjs 与 tests/catalog-loading.test.cjs，共 11 项；work/verify-live0413.cjs 回放公开源网页，源码和 --packed 各 10 项。上述 0.4.12 通用界面脚本属于历史版本，复用前需同步版本断言。
- 本次个人库连续滚动检查：work/verify-shelf0414.cjs（--packed 检查发行资源），各 21 项；相关既有功能测试 tests/usability.test.cjs、tests/refinements.test.cjs，共 6 项。
- 0.4.15：tests/customization.test.cjs（4 项）与 tests/marking.test.cjs（1 项）；完整检查在最后计数调整前通过 76 项，最后调整后定向通过 5 项。work/verify-custom0415.cjs 的源码/--packed 各 19 项，覆盖个人封面和书籍音乐等全部本次范围。
- 最新报告：work/release-0.4.15-verification.json；载入报告 work/loading0412-results.json 与 work/loading0412-packed-results.json。历史过程在 PROGRESS.md，仅按需读取。
- 文档/索引修改只检查链接和内容，不运行应用测试或重新打包。

## 完整约定的章节位置

文件：docs/ENGINEERING_NOTES.md。以下为快照位置，后续插入内容后用 rg 定位章节。

- 0.4.6 实现约定：第 40 行
- 0.4.7 实现约定：第 51 行
- 0.4.8 实现约定：第 60 行
- 0.4.9 实现约定：第 69 行
- 0.4.10 实现约定：第 77 行
- 0.4.11 实现约定：第 85 行
- 0.4.12 实现约定：第 94 行
