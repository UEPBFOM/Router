// 数据库连接。运行时用池化连接 DATABASE_URL；
// neon-http 驱动每次查询走一次 HTTP 请求，适合 Vercel 这种 serverless 环境（没有长连接可保持）。

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("缺少环境变量 DATABASE_URL");

export const db = drizzle({ client: neon(url), schema });
