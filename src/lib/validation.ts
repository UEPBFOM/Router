// 请求校验，用 Zod 声明规则。
// 返回值保持 { ok, data } / { ok, errors } 的形态，Route Handler 不用关心用的是什么校验库。

import { z } from "zod";
import type { CreateTodoInput, UpdateTodoInput } from "./todo-store";

type Result<T> = { ok: true; data: T } | { ok: false; errors: string[] };

const TITLE_MAX = 200;

const title = z
  .string({ error: "title 必须是字符串" })
  .trim()
  .min(1, "title 不能为空")
  .max(TITLE_MAX, `title 不能超过 ${TITLE_MAX} 个字符`);

const completed = z.boolean({ error: "completed 必须是布尔值" });

// strictObject：出现未声明的字段直接报错，防止客户端误传或篡改 id、userId 等字段
const createTodoSchema = z.strictObject(
  { title, completed: completed.optional() },
  { error: "请求体必须是 JSON 对象" },
);

const updateTodoSchema = z
  .strictObject(
    { title: title.optional(), completed: completed.optional() },
    { error: "请求体必须是 JSON 对象" },
  )
  .refine((v) => Object.keys(v).length > 0, "至少要提供一个要更新的字段");

const idSchema = z.uuid();

function toResult<T>(r: z.ZodSafeParseResult<T>): Result<T> {
  if (r.success) return { ok: true, data: r.data };
  return {
    ok: false,
    errors: r.error.issues.map((i) =>
      i.code === "unrecognized_keys" ? `不允许的字段: ${i.keys.join(", ")}` : i.message,
    ),
  };
}

export function parseCreateTodo(body: unknown): Result<CreateTodoInput> {
  return toResult(createTodoSchema.safeParse(body));
}

export function parseUpdateTodo(body: unknown): Result<UpdateTodoInput> {
  return toResult(updateTodoSchema.safeParse(body));
}

// id 列是 uuid 类型，格式不对的 id 直接当作"不存在"，不要把它送进数据库（会触发类型错误变成 500）
export function isValidId(id: string): boolean {
  return idSchema.safeParse(id).success;
}
