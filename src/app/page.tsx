// 首页：服务端读取会话，显示当前登录状态。

import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px" }}>
      <h1>Todo API</h1>
      {session ? (
        <>
          <p>
            已登录：{session.user.name}（{session.user.email}）
          </p>
          <SignOutButton />
        </>
      ) : (
        <p>
          未登录。<Link href="/sign-in">登录</Link> 或 <Link href="/sign-up">注册</Link>
        </p>
      )}
    </main>
  );
}
