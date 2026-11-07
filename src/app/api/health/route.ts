// /api/health —— 健康检查：能连上数据库就返回 { ok: true }

import { sql } from "drizzle-orm";
import { db } from "@/db";

// 每次请求都真正查一次数据库，不要在构建时被预渲染成静态结果
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err) {
    // 详细错误只打到服务端日志，不返回给客户端（可能包含连接信息）
    console.error("health check failed:", err);
    return Response.json({ ok: false }, { status: 503 });
  }
}
