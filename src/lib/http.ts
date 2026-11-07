// 统一的响应格式：成功返回 { data }，失败返回 { error: { message, details? } }。

import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, message: string, details?: string[]) {
  return NextResponse.json({ error: { message, details } }, { status });
}

// request.json() 在请求体不是合法 JSON 时会抛错，这里把它变成 undefined，交给校验函数处理。
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
