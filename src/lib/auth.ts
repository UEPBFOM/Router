// Better Auth 服务端配置。只能在服务端用（会读密钥、连数据库），
// "server-only" 保证它一旦被打包进浏览器端代码，构建就会直接报错。

import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  // 密钥和站点地址分别从 BETTER_AUTH_SECRET、BETTER_AUTH_URL 环境变量读取
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // neon-http 驱动不支持事务，保持关闭（默认值，这里写明是为了提醒）
    transaction: false,
  }),
  emailAndPassword: { enabled: true },
  // 让 Server Action 里调用 auth.api.* 时也能正确写入 cookie；必须放在插件列表最后
  plugins: [nextCookies()],
});
