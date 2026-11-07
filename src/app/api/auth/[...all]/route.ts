// /api/auth/* —— Better Auth 的所有接口（注册、登录、登出、获取会话……）都由它处理。
// [...all] 是"捕获所有段"：/api/auth/sign-in/email、/api/auth/get-session 等都会进到这里。

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
