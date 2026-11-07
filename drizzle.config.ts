// drizzle-kit 的配置：根据 schema.ts 生成迁移文件到 ./drizzle，并执行迁移。
// 迁移用直连 DATABASE_URL_UNPOOLED：DDL 和迁移事务不适合走连接池。

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit 不会像 Next.js 那样自动读取 .env.local，这里手动加载
config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("缺少环境变量 DATABASE_URL_UNPOOLED");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
