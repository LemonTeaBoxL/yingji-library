# 完整实现约定与历史（按需读取）

以最新版本覆盖旧版本同类约定；入口与用户偏好见根目录 AGENTS.md。

# 项目工作位置

唯一项目目录：D:\00.AiWorkSpace\20261123-作品观看记录工具。
所有源码修改、命令、测试、依赖安装、临时文件与打包均在此目录；中间文件放 work，发行包放 releases。旧聊天目录不再作为源码位置。用户要求不使用额度重置卡。

- 当前版本 0.4.12；最终入口根目录 映迹资料库-0.4.12.exe，启动映迹.lnk 指向该文件，归档 releases/映迹资料库-0.4.12-Windows-x64.exe。发行完成校验见 work/release-0.4.12-verification.json。
- 旧程序保留。不要结束用户窗口或覆盖被占用的旧程序。启动新版前用户需退出旧版，否则单实例机制会显示旧窗口。测试全部使用 YINGJI_TEST_PROFILE 独立目录，不访问用户个人库。
- npm start 为开发入口；npm run check 为语法与 71 项功能测试；npm run build:glass 构建材质；npm run package 生成 Windows x64 便携包。work/verify-v046.cjs 与 --packed 各 207 项 UI/IPC 检查，work/native-window-run-046.cjs 与 --packed 各 9 项原生能力检查。所有测试使用独立 YINGJI_TEST_PROFILE。离屏截图需 capturePage 驱动绘制后再取样。
- 主材质为未修改的 liquid-glass-react 1.1.1 与 React/React DOM 19.3.1；适配 src/rdev-glass.jsx，本地包 dist/vendor/rdev-glass.js；哈希和许可证在 dist/vendor。历史 Hyalite 资源不加载。不使用 CDN。
- 0.4.4 修正原生透明：旧 backgroundMode=transparent 自动迁移为 desktop 并保存；原生窗口 transparent=false、resizable/maximizable/thickFrame=true，桌面模式使用 Windows acrylic，支持 Win11 22H2+，不支持时使用应用流光背景。模式切换不需重启。不要改回固定尺寸 alpha 穿透窗口。
- CSS backdrop-filter 不能采样其他应用/桌面。桌面由系统实时磨砂，系统控制强度；网页折射只处理应用内背景，禁止声称与桌面像素折射相同。面板磨砂、折射与放大滑块在桌面模式也必须可用；这些值控制应用内面板，桌面系统磨砂强度另由 Windows 决定。不要再一并禁用。真实 native CUA 检查已观察窗后条纹被柔化且随背景变化，foreground 清晰可点击；旧 alpha 截图不足以证明磨砂。
- lib/window-material.cjs 避免重复重设相同材质和背景色，减少外观保存重绘。nativeTheme 跟随应用主题。窗口圆角、阴影由 Windows 提供，单一白色细窗框；最大化取消 CSS 边框圆角。不要添加外层黑底、壳层留白或重复深色框。
- 材质与前景分离：body 层 z-index 1 放侧栏/筛选材质，app-shell z-index 2；详情材质作为 body 的独立固定层 z-index 30，遮罩伪元素 z-index 29，sheet 前景 z-index 31。液态样式的 overlay 必须 position:absolute、z-index:auto、opacity:1，不能形成遮挡材质的固定或透明度堆叠层。不能把背景采样层移进滚动裁切容器。原版 React 组件与交互高光保留，包源码未修改；src/optical-map.js 与适配层提供直接 backdrop SVG 采样、圆角法线、GaussianBlur 与透镜放大，替代失效的嵌套 warp 路径。不要声称适配层光学实现是原包原封不动的效果。前景不进入滤镜。
- 启用动效时恢复原组件指针高光；关闭动效或系统减少动效时传入中性指针。不对每个封面卡片挂 React 根。详情有阅读底色下限，且必须真实磨砂应用背景；不能只靠加白底遮盖。边缘汇光为视觉模拟，不是光线追踪焦散。夜间保留深色底。
- 用户要求参考 emilkowalski/skills；本地参考 work/emil-ui-reference。实现 dist/motion.js/css：常用导航/键盘即时响应；弹窗 200ms 入场、140ms 退场；下拉按展开方向设置 origin，相邻菜单不重复延迟。YingjiMotion.deferClear 的 epoch 保护不可破坏，逻辑关闭立即生效，快速重开取消旧清理。
- 原比例素材墙/局部拖拽/放大镜在 dist/refinements.js/css、gallery-layout.js。读取 aspectRatio 用 parseFloat。发现作品用短列绝对定位连续瀑布流，紧凑/舒适/大封面改变列宽；追加保留节点，appending 在 renderCatalogResults 后清除。不要用会自动平衡的 CSS 多列。
- 视频海报按可见性生成，最多 2 并发，preload=none；未播放时只显示海报和播放按钮，点击后真实解码并显示控件。禁止反复移动节点触发视频重载。
- 字体内置 Noto Sans SC 可变黑体，优先已安装苹方。统一标题、正文和按钮字重，不引入衬线大标题。
- SQLite 优先 node:sqlite 只读分页，回退 sql.js。工作线程请求序号不得被条目 ID 覆盖；进度与结果分开，文本分页保留 hasMore、支持 BOM。
- 用户手动类目独立保存。移除记录保留原文件、撤销数据与 hiddenIds；移除文件夹来源不删除个人记录或关联素材。缓存清理只在受控缓存目录；刷新资料保留评分、观后感、单集记录、本地修订。
- Bangumi 地区按社区标签，季度/地区组合使用源站评分；游戏类型 4。TMDB 密钥保存在本机；AI 接口仅本机只读，不声称已有写入操作。
- work/optical044-production.json 验证真实软件背景折射/磨砂变化；work/motion-frames-044.json 验证真实 opacity/display 轨迹。work/native-window-044*.json 仅证明创建/迁移/主题/缩放能力，视觉磨砂以原生窗口观察为准。不承诺所有硬件固定帧率。

- 0.4.4 动画改为前景 sheet 与独立材质层分别淡入淡出，overlay 只做 display 离散过渡；原 epoch 重开保护保留。检查 work/motion-frames-044.json 时 opacity 取 sheet，display 取 overlay。禁止把 opacity 动画再放回材质的父容器。
- 侧栏顶部品牌固定；sidebar-scroll 只包导航和分组标签，内部 14/22px 安全边距、柔和裁切、4px 滚动条。侧栏底部单独留白。缩放到 200% 时顶部不得越过圆角边框。
- 标题栏按钮 DOM 顺序必须与视觉相同：右/中 minimize,maximize,close；左 close,maximize,minimize。避免只用 CSS order 造成键盘顺序不一致。
- 面板磨砂范围 0–40px，glassMagnification 100–115%，默认 104%；边缘折射 0–100%。几何法线纹理最多缓存 12 个，指针与滑块只更新参数，不应每次 pointermove 重算法线。
- 光学验证：work/optical044-production.json 分开比较折射、放大、磨砂；work/popup-optics044.json 在桌面模式、关闭遮罩模糊及面板白底后测量详情背景高频能量，不能用 CSS 数值检查代替。包来源与适配分工详见 dist/vendor/rdev-glass-provenance.json。

- 0.4.5 用户 13 项优化集中在 dist/usability.js/css、entry-order.js、glass-menus.js；npm run check 含 25 项功能测试；work/verify-v045.cjs 与 --packed 各 167 项。work/actual-popup045.cjs 在实际应用页面而非人工条纹上量测磨砂，移除遮罩与白底后高频能量比应小于 .2；截图先驱动离屏绘制再取样。原生最终核验窗口实际观察通过。
- 0.4.5 MaterialReady 与 ResizeObserver 同时处理隐藏／显现和尺寸变化，宽高为 0 时也要记录。重复打开同尺寸详情必须恢复 node.hidden=false；材质未就绪时使用阅读底色。详情前景新增 CSS backdrop blur 最终扩散，补全 SVG 未柔化的 Chromium 合成层；不能再清掉这项并声称只看 SVG 参数即可验证。overlay 仍无滤镜、无 opacity 堆叠；外部页面只暗化。
- 0.4.5 FileList 必须在 renderer 先 Array.from，再经过 contextBridge 传 File 数组，preload 用 webUtils.getPathForFile。attachMaterials/attachDropped IPC 调用 libraryService.attachMaterials，显式重新拖入会恢复隐藏文件；正常扫描不得复活隐藏条目。主进程 commit 递增 revision，旧返回不得覆盖新状态。
- 0.4.5 renderResults/renderCatalogResults 使用 keyed reconcile，点击观看／收藏和缓存完成保留节点、顺序与尺寸；用户主动调整排序时重排。列分配按索引取模，避免加载后随机换列。关闭详情恢复主列表缩略图队列与连续加载。
- 标记条目内部路由仍为 watched，state.markedView 为 watched/pending。多选为卡片点击和高光边框；禁止恢复左上复选框。发现作品附加筛选/排序作用于已载入作品；地区/季度 Bangumi 近期首播为当前批次，界面与说明必须保留范围提示。

## 0.4.6 实现约定
- dist/workspace-ui.js/css 最后加载，episode-progress.js 在它之前。记忆搜索筛选、历史组合、旁路搜索、共享排序布局、快捷外观、重启和进度控件在此。常规桌面筛选栏两行，窄窗口响应式换行。个人资料库排序移到 library-layout-bar 后，usability.js 的排序 dirty 标记必须覆盖这个位置。
- 列表容器只使用 data-layout-view。data-view 仅用于布局按钮；app.js 会把任何 data-view 祖先当作按钮，给容器恢复这个属性会导致卡片无法打开。导航退出选择模式。封面自身 display:block、内部 thumbnail 绝对定位并裁切，避免 flex 宽度偏移。
- glass-menus.js 中圆角外壳 overflow:hidden，内部 glass-menu-scroll 才 overflow:auto；键盘 focusOption 保证内部滚动，不让整个页面跟着滚动。不要把滚动条恢复到浮窗最外层。
- 查询记忆键 yingji-workspace-v1，发现作品与各 library 路由分开保存，保留最近 24 个不同组合。searchBypass 只在 query 非空时绕过非结构筛选；保留数据源、作品类型范围，清空关键词自动恢复选择。服务请求和前端本地筛选都需旁路，不能只修改界面。
- 快捷外观在 body 的独立 workspace-popover（z-index 700），菜单 z-index 900；限定在详情宽度内并支持滚动。调滑条只 applyPreferences，不重建详情；白色底色更新实际阅读层透明度，在全部区间连续变化。始终可用的重启按钮使用 data-restart-now，避免被旧 data-restart-app 条件移除逻辑误删；重启前 flushPersonalDrafts 和 persistGlassSettings。
- dist/episode-progress.js 是浏览器和主进程共享的进度模型。保存 progressThrough、watchedCount、progressTotal、episodeOrder 与原 episodeStates，实际集数列表 total 优先。拖动批量标前 N 集，单集覆盖更新总数，保留单集评分和评论。刷新元数据保留这些进度字段；勿通过写新的一份库实现同步。
- 0.4.6 将 0.4.5 的最终阅读扩散从 sheet 自身迁到独立 body 层 rdev-reading-diffusion；它与光学层同为 z-index 30，按 DOM 顺序先扩散、再光学，前景 sheet 仍 31。扩散内缩 5–8px，避免最后再模糊把边缘折射抹掉；不得删除扩散层，只靠白底掩盖。白色浓度在亮暗主题分别连续映射，保留默认阅读对比度。
- src/optical-map.js 生成窄边 mask，SVG 用未模糊 SourceGraphic 在窄边位移，中心保留磨砂与放大；最大边宽 8 CSS px。去掉原组件宽阴影和 7px 发光装饰。work/optical046-production.json 检查位移落在窄边（1862 像素变化、内部 0），work/actual-popup046-source.json / -packed.json 在实际页面禁用遮色后检查高频衰减；不能用滑条数值代替真实画面证明。窗外桌面依然由 Windows acrylic 提供，不截取桌面像素。
- 发行核验：72 个发行资源逐一与源码比对，31 项功能测试，源码和发行包各 207 项 UI/IPC，原生各 9 项，光学/动效/独立 EXE 启动验证通过。截图在 releases/0.4.6-两行筛选.png、0.4.6-快捷外观.png、0.4.6-单集进度.png。

## 0.4.7 实现约定
- lib/storage-main.cjs 在 app ready 前设置用户选择的资料根目录；runtime、浏览器缓存、localStorage、日志与崩溃文件均位于该目录。系统原配置目录仅留 library-location.json 位置指引。测试 YINGJI_TEST_PROFILE 不读取真实 locator。更改位置需用户选目录并确认，复制后重启；原目录保留，不能删除真实用户资料。
- lib/portable-store.cjs 提供 UTF-8 明文 library.json 和 entries/<id>/entry.json。运行时解析成绝对路径，磁盘托管路径相对保存；每个作品复制独立 materials 素材，并通过 ownerEntryId 标记。手动封面选择也要 copyLinks。原文件保留，缺失老文件不能阻止启动。全局索引在 worker 原子写入，只更新变化的条目侧文件；storageBytes 在同一写入结果回传。
- state-worker.cjs 使用 PortableStore，不得退回压缩单行私有格式。普通备份保留绝对引用以连接仍在的副本；服务器覆盖下载前备份整份 entries，并保存相对引用。清空有 native warning，先备份再置 initialized=true，空库下次不能重新载入 demo。
- WebDAV 用账号/应用密码验证，密码 safeStorage 加密，仅本地保存。禁止把旧服务器密码自动发送到新地址。手动整库快照同步：流式上传、SHA-256 下载校验、ETag 条件发布、拒绝未读取的远程更新。只同步公开索引和当前条目文件，不能上传 runtime、缓存或密钥。不是实时挂载或多设备自动合并。
- dist/library-vault.js/css 最后加载，个人条目 manual 路由、单条空间用量、Bangumi infobox、素材框选/Ctrl/Shift/Ctrl+A/Delete/完成选择在此。删除只有经过 native confirmation 才发生，且仅删除受控且无其他引用的副本。清空两种多选都要清除高光；不得恢复左上角复选框。
- 集数进度仅 source pane；personal-review 初始 80px。完整 infobox 在 normalizeBgm 保存，旧缓存缺字段时补拉，离线仍保留旧资料。
- 0.4.7 通过 41 项功能测试、源码/发行各 33 项 UI/IPC、迁移各 8 项；原生窗口实际观察框选与完成清除。发行报告 work/release-0.4.7-verification.json；独立 EXE 启动测试保持隔离资料目录。

## 0.4.8 实现约定
- 用户明确取消外部文件来源/连接/重新扫描功能。界面删除 sources 路由和读取文件夹按钮；preload 不暴露 chooseFolder/rescan/removeSource，主进程也不注册旧入口。顶部按钮刷新当前页面。资料根目录选择仍保留，它不是外部索引。
- lib/managed-imports.cjs 统一验证具体文件并复制入 imports，拒绝目录/符号链接；普通拖入、选择文件、JSON/SQLite 数据都使用副本，sources 始终为空。每条目关联素材继续复制至 entries/<id>/materials。旧索引 adoptFiles 保留 ID、转副本，找不到源文件时保留不可用记录。
- 用户的新要求覆盖此前“清空保留备份/素材”约定。清空需要 warning 确认，不新建备份；删除本机条目、托管素材、旧备份、封面和作品缓存。保留外观/服务器设置和原始源文件，不自动清除服务器历史快照。不要执行真实用户资料库清空作为测试。
- lib/safe-purge.cjs 删除前检查 library-format、绝对和真实路径、保护源文件及拒绝 junction/symlink。仅清理 entries/imports/backups/offline-works/covers/thumbnails/catalog-cache/sync-staging 和自身残余隔离目录，禁止直接递归删除资料根目录。先隔离，索引写入失败回滚，成功后删除隔离副本；不可绕开原文件检查。
- main activeMutations 与 PortableStore.pending 跟踪整次导入和复制。清空/迁移先等待活动写入和缩略图，再关闭数据库 worker 的只读连接，避免复制进行中清空后又恢复旧条目。空库 initialized=true，不恢复 demo；空库写入重置侧文件签名缓存。
- dist/owned-library.js/css 最后加载；初始 load 的 acceptLibrary 不可误认为导入并切换页面。material-filter.js 根据有效 materialIds 筛选作品，封面不计为素材；本地素材页筛选关联到作品的副本。每路由记忆 materialFilter，搜索旁路生效，清空时清记忆和客户端缓存。
- 0.4.8：49 项功能测试，源码/发行包各 49 项 UI/IPC 和清空检查，各 8 项迁移检查，独立 EXE 启动通过；实际原生窗口观察筛选菜单与来源入口移除。报告 work/release-0.4.8-verification.json。

## 0.4.9 实现约定
- dist/source-order.js 在 owned-library.js 后最后加载。右键看过/待看调用 watch(status=unmarked)，取消工作观看标记并清零观看进度；保留收藏、评分、观后感、单集评分/评论、重点和素材。记录不删除。重新点击标记为 watched，或操作进度/单集状态重新标记。元数据刷新和 overrides 必须保留 unmarked/explicitMarked=false。
- 发现页只留 catalogSort 网站拉取方式：rank/trends/collects/date/title 对应排名/热度/收藏/日期/名称；禁止重新加 catalogOrder 或本地升降序。个人库排序仍独立保留。忽略旧发现页 order/orderDirection 记忆，不能隐式重排源站顺序。
- UI catalogBrowse 发送 sourceOrder=true，lib/bangumi-browser.cjs 直接读取 Bangumi browser 网页顺序和分页；失败/登录/验证页面不能当空结果缓存。未指定 sourceOrder 的旧只读 API 浏览入口仍保持原官方 API 行为。条目详情/集数/后台缓存继续使用官方 JSON API。
- 源网页格式、地区、年份写入浏览 URL；季度在源网页每一页内筛选并保留其 hasMore。有评分也只筛已载入作品。关键词调用官方搜索 API，仅 rank 与 collects(heat=收藏人数) 可用；trends/date/title 暂禁用，清空关键词恢复五项。不得把 search heat 伪称网页近期 trends。
- Bangumi 收藏/日期及部分筛选组合实测需要登录。catalog-login.cjs 开单独沙盒源站窗口，与默认 session/net.fetch 共享 cookie，账号密码由网站直接处理；关闭后重试。不读取密码，不绕过访问限制，不伪装成本地排序；未测试用户登录后的真实页面，仅离线夹具覆盖五种返回顺序。登录与验证页需显式提示。
- 0.4.9：55 项功能测试，源码/发行各 69 项 UI/IPC，迁移各 8 项及独立 EXE 启动通过，85 个资源逐一核对。实际匿名联网验证排名/热度/名称顺序和收藏/日期登录限制；报告 work/release-0.4.9-verification.json。

## 0.4.10 实现约定
- dist/discovery-session.js 在 source-order.js 后最后加载。离开发现页时保存原始 DOM 到 DocumentFragment，保留卡片/输入事件及已加载图片；返回复用同一节点和 client 数据，并按可见条目锚点恢复滚动位置。禁止导航时重新抓取、清空分页或强制置顶。同一导航重复点击不刷新；主动更改条件、手动刷新、重试仍按原行为读取。
- 恢复滚动分两帧等瀑布流布局稳定，用户 wheel/pointerdown/keydown 的 epoch 立即取消延迟定位。界面缩放/主题变更后重新排版但保留阅读锚点。此保留为运行中的页面切换，不承诺重启后恢复全部已载入 DOM。
- features.loadCatalog 完成时只在发现页存在时更新 coverage 节点，防止切去设置后空节点异常把成功结果误报为错误。搜索筛选历史选择显式使旧 result 失效，避免套用旧结果。
- catalog-login.cjs 给源站图片添加复制图片地址、复制图片、原图预览菜单，以及文本编辑菜单。预览用当前已经解码的图像转 PNG，保持原始尺寸且不新请求验证码；跨域/失效图像不能读取时明确提示用复制操作。预览是独立 sandbox/contextIsolation 窗口，无 Node/脚本/远程内容，随父窗口关闭；原始 URL 只在用户选择复制时进剪贴板。
- 登录窗口显式沿用主窗口 session，关闭后 flushStore 再让发现页重试。只复用程序自己的 Cookie，不提取外部浏览器 Cookie、不读取密码、不改变网站 Cookie 的过期规则。登录菜单测试仅用普通测试图片与隔离的假 Cookie，未自动操作真实登录或验证码。
- 0.4.10：59 项功能测试，源码/发行各 81 项 UI/IPC、图片与会话各 10 项、独立便携 EXE 启动通过；86 个资源逐一比对。报告 work/release-0.4.10-verification.json。

## 0.4.11 实现约定
- 本节覆盖旧版右键恢复标记后保留个人记录的约定。main.cjs 的 watch(status=unmarked) 必须转交 storage-main.cjs 的独占 unmarkEntry；先原生警告（默认取消），确认后删除作品、个人记录、独占素材副本及对应缓存，取消不变。低层 service.watch/upsert 禁止直接写 unmarked。不要在测试中操作真实资料库。
- lib/unmark-entry.cjs 规划受控删除，safe-purge.cjs 分阶段隔离、提交失败回滚；保护源文件、共享引用和外部目录，检查路径每一层 junction/symlink。已有备份和服务器快照不在单条删除范围。PortableStore.write 删除已移除 ID 的签名，重新添加相同 ID 必须恢复 entry.json。
- dist/marking.js 统一个人记录、素材可见性和计数。默认 unmarked 不显示在任何个人页面；升级只隐藏既有 unmarked，不静默删除旧文件。marked 全部包含 watched/pending/watching。旧的整部 important 映射 watching，单集 important/评分/评论保留。
- dist/marking-ui.js 与 usability.js 将标记条目四标签固定为 全部/看过/待看/在看，并与状态筛选双向联动；整部状态只保留三项，已观看统一看过。单集重点角标仍保留。dist/unmark.js 清除个人草稿、封面修订和客户端缓存，已删除手动条目关闭详情；发现页只更新对应操作和封面节点，不改变原有 DOM/顺序/滚动。
- Chrome 登录通过 lib/chrome-login.cjs 与 browser-extension，仅读取用户在扩展中明确选择的 bangumi.tv/bgm.tv/chii.in Cookie，不读取其他站点、密码或 Chrome 数据库。用户首次在 Chrome 加载已解压扩展；无后台脚本/自动采集。连接码十分钟、成功一次即失效；仅 127.0.0.1、真实扩展 origin、恒时令牌校验、限量 JSON。Cookie 只写入程序会话，不进入日志或资料明文文件。
- 扩展文件复制到选定资料根目录/browser-extension，不能让 Chrome 引用便携包临时目录。同步导入参与 activeMutations 和 storageControl 锁；迁移、清空等待其结束。Bangumi 浏览与登录复用所选源站域名/User-Agent，三个别名链接按当前域名打开。AI 接口仍只读。
- 0.4.11：67 项功能测试，源码/发行各 96 项 UI/IPC、扩展传输各 4 项、图片会话各 10 项、独立 EXE 启动通过；97 个发行资源逐一比对一致。扩展测试真实加载 Chromium 扩展并使用隔离假 Cookie，未读取/验证用户 Chrome 登录，不声称已自动安装。报告 work/release-0.4.11-verification.json。

## 0.4.12 实现约定
- dist/catalog-loading.js/css 在最后加载，覆盖旧 features.loadCatalog/loadMoreMasonry。usability.js 使用其 footer，并仅在 !autoPaused 时观察瀑布流底部；自动回调必须 loadMoreMasonry(true)，手动按钮为无参数。连续三页没有新增可见作品暂停自动翻页，按钮继续有效；不能把筛选空页视为源站最后一页。
- catalogClient.page 表示成功提交的页，pendingPage 表示正在请求的页。下一页由 result.page+1 计算，失败保留已提交页，不能先递增后在过期请求里 page--。requestId 防止已暂停/超时/旧筛选响应修改新列表。取消等待保留现有节点与数据，底层有界请求可继续完成缓存，迟到响应不显示。
- renderer 26 秒等待上限；lib/catalog-request.cjs 的 readResponse 在 20 秒内界定连接加正文读取，计时器拒绝与 abort 并用，即便传输忽略 abort 也释放 pending。JSON API 与网页共同使用。超时后可用原缓存，不生成空成功缓存，旧 body 迟到不写缓存。节点追加、源站顺序与发现页导航恢复保持原约定。
- 源网页上限 1000 页时 hasMore 必须停止，避免 page 被钳制后永远请求同一页；总页数更大时显示浏览上限说明。页脚显示源网页当前/总页数、暂停、重试与空页暂停原因。
- 0.4.12：71 项功能，源码/发行各 96 项通用 UI/IPC 与 20 项载入回归，独立 EXE 启动通过；100 个资源逐一比对。复现旧版 1.8 秒只显示一条却连续请求 16 页；修复后第四页暂停、loading=false。超时、同页重试、手动暂停、迟到响应及导航保留均用隔离资料验证，不改用户数据。报告 work/release-0.4.12-verification.json。

## 0.4.13 实现约定
- lib/bangumi-browser.cjs 的 browserRows 只在 browserItemList 根列表范围内按 li 嵌套深度取整条作品，跳过注释和脚本/模板文本；禁止恢复 first-closing-li 的正则截断。嵌套收藏菜单可能使旧解析丢掉标题或评分。sourceItemCount 保留源行数，季度过滤不影响源分页。
- 网页浏览缓存键升级 browser:3，旧不完整 v2 页面不会继续命中；不为此删除用户记录/素材或重写旧缓存。正常新缓存和源网页顺序保留。
- 现场只读确认旧的全部季度首页缓存为 1 条、公开源网页为 24 条；旧解析在带嵌套菜单的三行样例只返回一行，新解析返回三行。未捕获用户实际登录后的原始 HTML，不将样例验证冒称用户会话实测。
- 本次按风险验证：11 项解析/缓存/超时/分页功能检查，源码与发行包各 10 项公开 HTML 回放界面检查（首页 24 条、有评分、新作品、下一页、导航、旧缓存绕过），独立 EXE 启动，100 个资源匹配。未重复运行无关全套 GUI。报告 work/release-0.4.13-verification.json。

## 0.4.14 实现约定
- 个人库瀑布流在 dist/usability.js 的 renderResults 生成非按钮 library-more-sentinel，以 mainElement 为 root、400px 预加载，按原有每批 40 条增加 state.limit。列表/普通网格保留原显示更多按钮。适用于 all/watched/favorites/personal/media 与所有筛选，不改变 filtered 和排序。
- watchLibraryMore 在 scheduleCatalogWalls 之后等两帧观察，避免绝对定位布局尚未完成时误判底部。每次渲染/导航递增 epoch 并断开旧 observer，回调再次检查路由、视图、节点连接和详情关闭状态；单次只排一个追加回调。详情打开暂停，关闭后重新观察。不能把容器 data-layout-view 改为 data-view。
- 继续使用 keyed reconcile 保留已有卡片节点、位置、缩略图与选择；加载完成显示总数并停止观察，空结果不观察。不要一次创建全部条目的 DOM，也不要对自然滚动调用 scrollTo 强制定位。
- 本次 6 项相关功能测试，源码/发行各 21 项隔离 UI 检查（220 作品与 100 素材、各个人路由、筛选排序、多选、详情、切页、空结果和列表兼容），独立 EXE 启动及 100 个资源比对通过；未操作真实用户资料库。报告 work/release-0.4.14-verification.json。
