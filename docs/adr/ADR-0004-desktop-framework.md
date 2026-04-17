# ADR-0004-desktop-framework

## 状态

Accepted

## 背景

客户端需要一套新的桌面宿主方案，目标是：

- 包体更小
- 内存占用更低
- 本地高权限逻辑落在 Rust 受控层
- 前端继续保留 React + TypeScript 生态

同时，客户端未来会长期依赖本地运行时、本地数据库和系统能力，因此安全边界和资源占用都比单纯的 Web 壳更重要。

## 考虑过的选项

- `Tauri 2`
- `Electron`
- `Wails`

## 决定

桌面框架统一采用 `Tauri 2`。

## 原因

- 相比 `Electron`，`Tauri 2` 通常具有更小的安装包体积和更低的内存占用，更适合本地优先桌面工具。
- `Tauri 2` 可以自然把高权限逻辑放到 Rust 层，安全边界更清晰。
- 相比 `Wails`，`Tauri 2` 的生态和文档成熟度更符合当前前端 + Rust 双栈协作模式。
- `Tauri 2` 复用系统 WebView，而不是像 `Electron` 一样内置整套 Chromium，能降低分发和运行成本。
- 前端仍然可以保持 `React + TypeScript + shadcn/ui`，不需要放弃现有 UI 技术面。

## 后果

- 客户端必须接受系统 WebView 的差异性，而不是依赖统一内置 Chromium。
- Rust 层将成为本地能力与本地数据的核心边界，前端不能直接拿高权限能力。
- 打包、调试和插件生态与 `Electron` 不同，团队需要按 `Tauri 2` 的方式建立工具链。
- 如果未来对浏览器兼容性或 WebView 差异有更高要求，再评估补充策略，但当前不回退到 `Electron`。
