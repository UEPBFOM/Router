// /api/todos/[id] —— 单个资源
//   GET    查询一条
//   PATCH  部分更新
//   DELETE 删除

import { todoStore } from "@/lib/todo-store";
import { parseUpdateTodo } from "@/lib/validation";
import { fail, ok, readJson } from "@/lib/http";

// Next.js 15 起，动态路由的 params 是一个 Promise，需要 await。
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const todo = await todoStore.get(id);
  if (!todo) return fail(404, `找不到 id 为 ${id} 的 todo`);
  return ok(todo);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const parsed = parseUpdateTodo(await readJson(request));
  if (!parsed.ok) return fail(400, "请求参数不合法", parsed.errors);

  const todo = await todoStore.update(id, parsed.data);
  if (!todo) return fail(404, `找不到 id 为 ${id} 的 todo`);
  return ok(todo);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const deleted = await todoStore.remove(id);
  if (!deleted) return fail(404, `找不到 id 为 ${id} 的 todo`);
  // 204 No Content：删除成功，没有响应体
  return new Response(null, { status: 204 });
}
