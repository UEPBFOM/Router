// /api/todos/[id] —— 单个资源（需要登录，只能操作自己的 todo）
//   GET    查询一条
//   PATCH  部分更新
//   DELETE 删除
// 别人的 todo 一律返回 404 而不是 403：不透露"这个 id 存在，只是不属于你"。

import { todoStore } from "@/lib/todo-store";
import { isValidId, parseUpdateTodo } from "@/lib/validation";
import { fail, ok, readJson, unauthorized } from "@/lib/http";
import { getUserId } from "@/lib/session";

// Next.js 15 起，动态路由的 params 是一个 Promise，需要 await。
type Context = { params: Promise<{ id: string }> };

const notFound = (id: string) => fail(404, `找不到 id 为 ${id} 的 todo`);

export async function GET(request: Request, { params }: Context) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  if (!isValidId(id)) return notFound(id);

  const todo = await todoStore.get(userId, id);
  if (!todo) return notFound(id);
  return ok(todo);
}

export async function PATCH(request: Request, { params }: Context) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  const parsed = parseUpdateTodo(await readJson(request));
  if (!parsed.ok) return fail(400, "请求参数不合法", parsed.errors);
  if (!isValidId(id)) return notFound(id);

  const todo = await todoStore.update(userId, id, parsed.data);
  if (!todo) return notFound(id);
  return ok(todo);
}

export async function DELETE(request: Request, { params }: Context) {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  if (!isValidId(id)) return notFound(id);

  const deleted = await todoStore.remove(userId, id);
  if (!deleted) return notFound(id);
  // 204 No Content：删除成功，没有响应体
  return new Response(null, { status: 204 });
}
