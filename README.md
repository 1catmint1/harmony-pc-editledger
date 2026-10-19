# EditLedger

EditLedger 是鸿蒙 PC 本地文稿工作台，提供行号、语法着色、查找替换、文件保存与重新打开，以及全选、复制、剪切和粘贴。纯文本、JavaScript、Python、Markdown、CSS 使用页面内按钮切换；编码可选 UTF-8、UTF-16 LE/BE、BOM 和 LF/CRLF/CR 换行格式。

1.0.3 完善 Ctrl+A/C/X/V、保存、新建、查找、替换、撤销和重做的分发，并按编辑器、输入框、许可页处理键盘焦点。运行时未附带修饰键标志的输入路径使用按键状态补充，松键和失焦清理状态；Meta/Alt 组合保留系统处理。

文稿保存在应用自有目录。文件模块校验编码和 Unicode，使用摘要冲突检查、独占临时文件、同步与替换。PC 剪贴板权限用于用户主动粘贴文本，可在系统设置中管理。应用内可浏览隐私政策、组件许可与完整运行时告知。

主机检查通过：编解码 21 项、真实文件保存 11 项、异步保存绑定 6 项、主进程快捷键 12 项、实际 CodeMirror 界面交互 56 项。USB r12 完成 15 次语法切换、快捷键复制/剪切/粘贴/撤销/重做/保存、编码选择、文件回读与重新打开；原有文稿摘要保持一致。完整运行时告知末页 174/174 可访问。验收及正式包摘要见 evidence/review-repair-20261019.json。

## 构建与测试

harmony 是 API22 无签名工程源码。使用 Windows DevEco Studio 与对应 HarmonyOS SDK，安装工程固定的 OHPM 依赖，补充资源清单对应的 Electron 运行时资源与四个动态库，并配置自己的本机签名，执行 release assembleApp。

主机测试使用 Node 24 和 package.json 固定版本的 jsdom：npm test、npm run test:shortcuts、npm run test:ui。签名材料保留在本机私有目录。

## 许可与来源

发行界面及文件模块采用 MIT，编辑器使用 CodeMirror 5.65.16。Electron、Chromium、FFmpeg 与 HarmonyOS ArkTS 封装保留各自版权和许可，详见 THIRD_PARTY_NOTICES.txt 与 RUNTIME-SOURCE.md。原生库摘要见 evidence/native-assets.json，FFmpeg 对应源码随 third_party 提供。

来源基线：https://atomgit.com/OpenHarmonyPCDeveloper/ohos_notepadqq ，af84f88a6c4360937b9eefca5a59ba1d39603cd8。发行界面由本次适配编写，文件模块与测试在此前适配基础上完善；当前发行界面位于 harmony。

源码与反馈：https://atomgit.com/2301_80739235/editledger-notepadqq-adaptation
