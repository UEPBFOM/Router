# nextjs-crud

Next.js 15（App Router）+ TypeScript 写的 Todo CRUD 后端练习。

当前阶段：**Route Handler + 内存存储**。下一步：接数据库/ORM、登录鉴权、部署到 Vercel。

## 运行

```bash
npm install
npm run dev          # http://localhost:3000
bash scripts/smoke-test.sh   # 另开终端，跑一遍所有接口
```

> 数据存在内存里，重启服务就会恢复成两条种子数据。

## 接口

统一响应格式：成功 `{ "data": ... }`，失败 `{ "error": { "message", "details?" } }`。

| 方法 | 路径 | 说明 | 成功状态码 |
|---|---|---|---|
| GET | `/api/todos` | 列表，可选 `?completed=true\|false`、`?q=关键词` | 200 |
| POST | `/api/todos` | 新建，body `{ "title": string, "completed"?: boolean }` | 201（带 `Location` 头） |
| GET | `/api/todos/:id` | 查询单条 | 200 |
| PATCH | `/api/todos/:id` | 部分更新，body `{ "title"?, "completed"? }` | 200 |
| DELETE | `/api/todos/:id` | 删除 | 204 |

错误：参数不合法 → 400，id 不存在 → 404，方法不支持 → 405（Next.js 自动处理）。

## 目录结构

```
src/
  app/api/todos/route.ts        # GET 列表 / POST 新建
  app/api/todos/[id]/route.ts   # GET / PATCH / DELETE 单条
  lib/todo-store.ts             # 数据访问层（现在是内存 Map，之后换成 ORM）
  lib/validation.ts             # 请求体校验
  lib/http.ts                   # 统一响应 & 安全解析 JSON
scripts/smoke-test.sh           # curl 冒烟测试
```

## 几个值得注意的点

- **文件即路由**：`app/api/todos/route.ts` 里导出名为 `GET`/`POST` 的函数，就是对应 HTTP 方法的处理器。
- **Next.js 15 的 `params` 是 Promise**：动态路由里要 `const { id } = await params`。
- **分层**：Route Handler 只管 HTTP（解析、校验、状态码），存储逻辑在 `todo-store.ts`。接数据库时只改这一个文件。
- **`globalThis` 缓存**：开发模式热更新会重新执行模块，挂在 `globalThis` 上内存数据才不会丢。
- **PATCH vs PUT**：PATCH 只改传了的字段；校验时拒绝未知字段，防止客户端误传。
