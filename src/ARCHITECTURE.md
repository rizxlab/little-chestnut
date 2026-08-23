# 栗子小事代码结构

本目录承载产品代码。根目录的 `app` 只负责 Next.js 路由、布局和 API
适配，不再继续堆叠客户端业务逻辑。

## 目标结构

```text
src
├── app             应用组合入口、Provider 与运行配置
├── screens         路由级页面与工作区组合组件（不触发 Pages Router）
├── features        按业务领域组织的功能模块
├── components      跨领域复用的 UI 与布局组件
├── services        API、持久化、同步与数据迁移
├── shared          通用类型、Hook、常量与纯工具函数
├── styles          按布局、页面、组件、弹层、主题和动画拆分的样式；CSS variables 是视觉 Token 的唯一来源
```

## 业务模块

`features` 将按以下领域逐步建立：

- `tasks`：小事定义、完成、撤销、计时和有效期。
- `growth`：小事完成记录及其来源类型。
- `shells`：栗壳获取、消费、余额和流水。
- `rewards`：奖励项目与兑换记录。
- `statistics`：今日、本周、本月、日历及趋势聚合。
- `account`：登录、会话、账号数据归属与同步。
- `profile`：用户资料。
- `settings`：语言、主题和产品偏好。

## 依赖规则

1. `app` 可以组合页面和功能，但不实现业务规则。
2. `screens` 负责页面编排，不直接读写存储。
3. `features` 之间通过公开类型和服务协作，禁止跨目录读取内部文件。
4. `components` 不依赖具体业务数据结构。
5. `services` 隔离浏览器存储、网络请求和未来的云同步实现。
6. `shared` 只包含无业务副作用的通用代码。
7. 页面只通过各功能模块的公开类型、规则、Hook 和服务访问业务能力。

## 当前状态

`screens/CheckInPage.tsx` 是稳定的路由级组合入口；现有产品工作区位于
`screens/check-in/CheckInWorkspace.tsx`。账号同步、计时和手势生命周期已分别
迁入 `features/account`、`features/tasks` 和 `shared/hooks`，个人资料、奖励与登录
编辑器也已迁入相应 feature。`app/ChestnutApp.tsx` 提供稳定入口。
后续新增功能应直接进入对应 `features`，不再向工作区文件添加可复用规则或视图。
