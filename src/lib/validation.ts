// 手写的请求体校验。逻辑很简单，目的是看清楚校验到底在做什么；
// 真实项目里通常用 zod 之类的库代替。

import type { CreateTodoInput, UpdateTodoInput } from "./todo-store";

type Result<T> = { ok: true; data: T } | { ok: false; errors: string[] };

const TITLE_MAX = 200;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkTitle(title: unknown, errors: string[]): string | undefined {
  if (typeof title !== "string") {
    errors.push("title 必须是字符串");
    return;
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) errors.push("title 不能为空");
  else if (trimmed.length > TITLE_MAX) errors.push(`title 不能超过 ${TITLE_MAX} 个字符`);
  return trimmed;
}

export function parseCreateTodo(body: unknown): Result<CreateTodoInput> {
  if (!isPlainObject(body)) return { ok: false, errors: ["请求体必须是 JSON 对象"] };
  const errors: string[] = [];

  const title = checkTitle(body.title, errors);
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    errors.push("completed 必须是布尔值");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { title: title!, completed: body.completed as boolean | undefined } };
}

export function parseUpdateTodo(body: unknown): Result<UpdateTodoInput> {
  if (!isPlainObject(body)) return { ok: false, errors: ["请求体必须是 JSON 对象"] };
  const errors: string[] = [];
  const data: UpdateTodoInput = {};

  const allowed = new Set(["title", "completed"]);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) errors.push(`不允许的字段: ${key}`);
  }

  if (body.title !== undefined) data.title = checkTitle(body.title, errors);
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") errors.push("completed 必须是布尔值");
    else data.completed = body.completed;
  }
  if (Object.keys(body).length === 0) errors.push("至少要提供一个要更新的字段");

  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}
