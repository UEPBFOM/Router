# nextjs-crud

Next.js 15（App Router）+ TypeScript 写的 Todo 后端练习：数据存 Postgres，邮箱密码登录，每个用户只能操作自己的 todo。

线上地址：https://router-chi-liart.vercel.app

## 技术选型

| 部分 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 15 App Router | 接口写在 `route.ts`（Route Handler） |
| 数据库 | Neon Postgres | 通过 Vercel Marketplace 接入 |
| ORM | Drizzle + `@neondatabase/serverless` HTTP 驱动（`drizzle-orm/neon-http`） | 每次查询一个 HTTP 请求，适合 serverless；**不支持事务** |
| 迁移 | drizzle-kit（generate + migrate） | 迁移文件在 `drizzle/`，提交到 git |
| 鉴权 | Better Auth + drizzleAdapter | 只开了邮箱密码登录，session 存数据库，用 cookie 携带 |
| 校验 | Zod | 非法输入返回 400 |
| 部署 | Vercel | push 到 `main` 自动部署 |

## 本地启动

```bash
npm install
vercel link                      # 第一次：关联 Vercel 项目 router
vercel env pull .env.local       # 拉取数据库连接等环境变量
# 然后在 .env.local 末尾手动补上 BETTER_AUTH_SECRET 和 BETTER_AUTH_URL（见下文）
npm run db:migrate               # 把迁移应用到数据库（已应用过的会跳过）
npm run dev                      # http://localhost:3000
bash scripts/smoke-test.sh       # 另开终端：注册两个测试用户，走一遍所有接口
```

> ⚠️ `vercel env pull` 会**整个覆盖** `.env.local`，重新拉取后要把 `BETTER_AUTH_*` 两行补回去。

## 环境变量

| 名字 | 用途 | 来源 |
|---|---|---|
| `DATABASE_URL` | 应用运行时连接数据库（池化） | Vercel 的 Neon 集成自动提供 |
| `DATABASE_URL_UNPOOLED` | drizzle-kit 迁移用（直连） | 同上 |
| `BETTER_AUTH_SECRET` | 签名 cookie / token 的密钥，至少 32 字节随机值 | 本地自己生成；线上在 Vercel 单独设置，**与本地不同** |
| `BETTER_AUTH_URL` | 站点地址：本地 `http://localhost:3000`，线上是正式域名 | 手动设置 |

生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`.env*` 已在 `.gitignore` 中，不要提交。

## 数据库迁移

改了 `src/db/schema.ts` 之后：

```bash
npm run db:generate   # 根据 schema 差异生成 SQL 迁移文件到 drizzle/（记得 review 生成的 SQL）
npm run db:migrate    # 执行尚未应用的迁移
npm run db:studio     # 可选：打开 Drizzle Studio 浏览数据
```

改了 `src/lib/auth.ts` 里的 Better Auth 配置（比如加插件）后，先重新生成鉴权表的 schema，再走上面的 generate + migrate：

```bash
npx auth@latest generate --config src/lib/auth.ts --output src/db/auth-schema.ts
```

> CLI 无法加载带 `import "server-only"` 的配置文件：运行前临时注释掉 `auth.ts` 里那一行，生成后再恢复。

注意：目前本地开发和线上**共用同一个数据库**（Neon 集成给 Development / Preview / Production 配的是同一个连接），在本地执行迁移就等于改了线上库。

## 接口

统一响应格式：成功 `{ "data": ... }`，失败 `{ "error": { "message", "details?" } }`。

**鉴权**（Better Auth 提供，都在 `/api/auth/*` 下）：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/sign-up/email` | 注册，body `{ name, email, password }`，成功后设置 session cookie |
| POST | `/api/auth/sign-in/email` | 登录，body `{ email, password }` |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 当前会话，未登录返回 `null` |

用 curl 调 POST 接口时要带 `Origin` 头（Better Auth 的 CSRF 校验）。

**业务接口**（都需要登录，未登录返回 401；只能看到、操作自己的 todo）：

| 方法 | 路径 | 说明 | 成功状态码 |
|---|---|---|---|
| GET | `/api/todos` | 列表，可选 `?completed=true\|false`、`?q=关键词` | 200 |
| POST | `/api/todos` | 新建，body `{ "title": string, "completed"?: boolean }` | 201（带 `Location` 头） |
| GET | `/api/todos/:id` | 查询单条 | 200 |
| PATCH | `/api/todos/:id` | 部分更新，body `{ "title"?, "completed"? }` | 200 |
| DELETE | `/api/todos/:id` | 删除 | 204 |
| GET | `/api/health` | 健康检查（执行 `select 1`），不需要登录 | 200 |

错误：未登录 → 401；参数不合法（含未知字段）→ 400；id 不存在**或属于别人** → 404；方法不支持 → 405。

**页面**：`/` 显示登录状态，`/sign-up` 注册，`/sign-in` 登录。

## 目录结构

```
drizzle/                         # 迁移 SQL 和快照（drizzle-kit 生成，提交到 git）
drizzle.config.ts                # drizzle-kit 配置
src/
  db/
    index.ts                     # 导出 db（Drizzle + neon-http）
    schema.ts                    # 业务表 todos，并 re-export 鉴权表
    auth-schema.ts               # Better Auth 的表（CLI 生成，不要手改）
  lib/
    auth.ts                      # Better Auth 服务端配置（server-only）
    auth-client.ts               # Better Auth 浏览器端客户端
    session.ts                   # Route Handler 里取当前用户 id
    todo-store.ts                # 数据访问层，所有查询按 userId 过滤
    validation.ts                # Zod 校验
    http.ts                      # 统一响应格式
  app/
    api/auth/[...all]/route.ts   # Better Auth 的所有接口
    api/todos/route.ts           # GET 列表 / POST 新建
    api/todos/[id]/route.ts      # GET / PATCH / DELETE 单条
    api/health/route.ts          # 健康检查
    page.tsx, sign-in/, sign-up/ # 页面
scripts/smoke-test.sh            # curl 冒烟测试（可传线上地址）
```

## 几个值得注意的点

- **真正的鉴权在 Route Handler 里**：每个业务接口先用 cookie 查会话，查不到就 401。只看 cookie 是否存在是不够的，cookie 可以伪造。
- **按用户隔离靠查询条件**：所有查询都带 `user_id = 当前用户`，别人的数据对你来说就是"不存在"，所以返回 404 而不是 403。
- **客户端传的字段要白名单**：Zod 的 `strictObject` 拒绝未知字段，客户端没法通过传 `userId` 把数据写到别人名下。
- **neon-http 不支持事务**：Better Auth 的 drizzleAdapter 对 Postgres 默认不开事务，所以兼容；以后自己写多步写入时要注意。
- **分层**：从内存存储换成数据库时，只改了 `todo-store.ts`，Route Handler 几乎没动。
