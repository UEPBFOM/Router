// Better Auth 浏览器端客户端：页面里调用 signUp / signIn / signOut，它会去请求 /api/auth/*。
// 前后端同域名，不需要配置 baseURL。

import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient();
