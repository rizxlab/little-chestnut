# 栗子小事（Little Chestnut Things）

栗子小事是一个记录微小行动、成长领域和栗壳奖励的个人成长 PWA。

## 功能

- 创建、编辑、计时和完成小事
- 按成长领域记录成长值与等级
- 获取栗壳并兑换自定义奖励
- 今日、本周、本月、总计和日历统计
- 游客本地使用与账号数据同步
- 可安装的移动端 PWA

## 技术栈

- Next.js 16、React 19、TypeScript
- vinext、Vite、Cloudflare Worker
- Cloudflare D1、Drizzle ORM
- Web Manifest、Service Worker

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

本地默认地址为 `http://localhost:3000/`。

## 质量检查

```bash
npm run lint
npx tsc --noEmit --incremental false
npm test
```

`npm test` 会先完成生产构建，再检查产品入口、目录边界和 PWA 元数据。

## 目录说明

- `app`：Next.js 页面、布局和 API 路由适配。
- `src/app`：产品组合入口。
- `src/screens`：页面编排（避免与框架的 Pages Router 约定冲突）。
- `src/features`：小事、成长、栗壳、奖励、统计、账号和设置。
- `src/components`：跨业务复用的 UI 和布局组件。
- `src/services`：API、本地持久化、数据规范化与迁移。
- `src/stores`：跨页面产品状态。
- `src/shared`：通用类型和工具。
- `src/styles`：全局样式与主题。
- `db`、`drizzle`：D1 数据库定义和迁移。

详细边界见 [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md)。

## 数据兼容

当前版本继续兼容原有 `lizi-growth-v2` 本地数据和 D1 账户 JSON。新的
`schemaVersion` 用于后续增量迁移，避免一次性重建或丢失历史记录。
