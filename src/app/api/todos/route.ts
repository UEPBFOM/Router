// /api/todos —— 集合资源
//   GET  列表（支持 ?completed=true|false 和 ?q=关键词）
//   POST 新建

import type { NextRequest } from "next/server";
import { todoStore } from "@/lib/todo-store";
import { parseCreateTodo } from "@/lib/validation";
import { fail, ok, readJson } from "@/lib/http";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const completedParam = params.get("completed");
  if (completedParam !== null && completedParam !== "true" && completedParam !== "false") {
    return fail(400, "completed 只能是 true 或 false");
  }

  const todos = await todoStore.list({
    completed: completedParam === null ? undefined : completedParam === "true",
    q: params.get("q") ?? undefined,
  });
  return ok(todos);
}

export async function POST(request: Request) {
  const parsed = parseCreateTodo(await readJson(request));
  if (!parsed.ok) return fail(400, "请求参数不合法", parsed.errors);

  const todo = await todoStore.create(parsed.data);
  // 201 Created + Location 头：告诉客户端新资源在哪
  const response = ok(todo, 201);
  response.headers.set("Location", `/api/todos/${todo.id}`);
  return response;
}
