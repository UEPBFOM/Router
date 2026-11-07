"use client";

// 注册和登录共用的表单。mode 决定显示哪些字段、调用哪个接口。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setPending(true);
    setError(null);
    const { error } = isSignUp
      ? await signUp.email({ email, password, name: String(form.get("name")) })
      : await signIn.email({ email, password });
    setPending(false);

    if (error) return setError(error.message ?? "出错了，请重试");
    router.push("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: "0 16px" }}>
      <h1>{isSignUp ? "注册" : "登录"}</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {isSignUp && <input name="name" placeholder="昵称" required />}
        <input name="email" type="email" placeholder="邮箱" required />
        <input
          name="password"
          type="password"
          placeholder="密码（至少 8 位）"
          minLength={8}
          required
        />
        <button type="submit" disabled={pending}>
          {pending ? "请稍候…" : isSignUp ? "注册" : "登录"}
        </button>
        {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      </form>
      <p>
        {isSignUp ? (
          <>已有账号？<Link href="/sign-in">去登录</Link></>
        ) : (
          <>还没有账号？<Link href="/sign-up">去注册</Link></>
        )}
      </p>
    </main>
  );
}
