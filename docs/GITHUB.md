# GitHub 仓库与发布

- 仓库：https://github.com/LemonTeaBoxL/yingji-library
- 可见性：私有；默认分支：`main`。
- 当前发行标签：`v0.4.14`。
- 提交署名：TeaBox Lemon；使用 GitHub 隐私邮箱。
- 源码、依赖锁定文件、项目索引、使用说明与归档目录清单提交到 Git。
- 最新 Windows 程序放在 Release 附件；旧版二进制文件保留在本机“历史版本”。

## 本机操作

项目已初始化 Git，`origin` 指向上述仓库。GitHub CLI 保存在项目 `work/git-tools`，位置记录于 `work/git-tools-location.json`。登录授权由 GitHub CLI 的系统凭据存储管理，Git 仅配置调用登录工具，不把令牌写入源码。

之后用户要求上传更新时，完成修改并按风险验证，再提交、推送 `main`；有新程序版本时创建对应版本标签和 Release，上传 `releases` 中的便携程序。无需每次重新创建仓库或重复登录；授权过期时再按官方流程处理。

`work`、`node_modules`、用户资料、程序 EXE 和快捷方式均忽略，不随源码上传。完整个人资料库仍只在用户选定的资料目录，或用户主动同步的 WebDAV 服务器中。
