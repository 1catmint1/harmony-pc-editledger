# EditLedger

EditLedger 是鸿蒙 PC 本地文稿工作台。纸张色编辑区配合独立文件栏，提供行号、语法着色、查找替换、文件保存与重新打开，以及全选、复制、剪切和粘贴。用户可以选择 UTF-8、UTF-16 LE/BE、BOM 和 LF/CRLF/CR 换行格式，处理日常笔记、代码片段和纯文本资料。

文件模块校验编码与 Unicode，保存前后核对摘要，以独占临时文件写入、同步和替换。文稿只保存在应用自有目录。应用内提供隐私政策、各组件许可和完整运行时告知。

1.0.2 界面及文件模块采用 MIT 许可，编辑器使用 CodeMirror 5.65.16。Electron、Chromium、FFmpeg 与 HarmonyOS ArkTS 封装保留各自版权和许可；详见 THIRD_PARTY_NOTICES.txt 与 RUNTIME-SOURCE.md。四个原生动态库的固定摘要见 evidence/native-assets.json。FFmpeg 对应源码随 third_party 提供。

主机编解码 21 项、文件保存 11 项、编辑命令、新界面与完整告知集成 18 项检查通过。真机与发行包的验证记录在 evidence 中按最终工件摘要记录。

## 构建

harmony 是 API22 的无签名工程源码。使用 Windows DevEco Studio 的 HarmonyOS SDK，安装工程中固定的 OHPM 依赖，并补充与资源清单匹配的 Electron 运行时资源与四个动态库。配置自己的本机签名，执行 release assembleApp。所有运行库保留原通知；运行时资源由匹配的上游发行物取得。签名材料只保留在本机私有目录。

来源基线：https://atomgit.com/OpenHarmonyPCDeveloper/ohos_notepadqq ，af84f88a6c4360937b9eefca5a59ba1d39603cd8。1.0.2 发行界面由本次适配编写，文件模块与测试在此前适配基础上完善。原社区前端保留在独立来源工作区，发行界面由 harmony 中的代码组成。

源码与反馈：https://atomgit.com/2301_80739235/editledger-notepadqq-adaptation

PC 剪贴板权限用于用户主动粘贴文本，可在系统设置中管理。文稿保持在应用自有目录。主机 UI 测试使用 Node 24 和固定版本 jsdom，执行 npm run test:ui。
