// 在 Route Handler 里取当前登录用户。真正的鉴权就在这里：
// Better Auth 用请求里的 session cookie 去数据库查会话，过期或伪造的 cookie 都会得到 null。

import "server-only";
import { auth } from "./auth";

export async function getUserId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}
