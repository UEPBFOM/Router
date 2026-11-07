// 数据访问层（Repository）。
// 已从内存 Map 换成 Postgres（Drizzle）；方法名和参数没变，所以 Route Handler 基本不用改。

import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { todos, type Todo } from "@/db/schema";

export type { Todo };
export type CreateTodoInput = { title: string; completed?: boolean };
export type UpdateTodoInput = { title?: string; completed?: boolean };
export type ListTodoFilter = { completed?: boolean; q?: string };

// LIKE 里 % 和 _ 是通配符，用户搜索的文字要转义，否则搜 "100%" 会匹配到意料之外的结果
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const todoStore = {
  async list(filter: ListTodoFilter = {}): Promise<Todo[]> {
    const conditions: SQL[] = [];
    if (filter.completed !== undefined) conditions.push(eq(todos.completed, filter.completed));
    if (filter.q) conditions.push(ilike(todos.title, `%${escapeLike(filter.q)}%`));

    return db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdAt));
  },

  async get(id: string): Promise<Todo | null> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    return todo ?? null;
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const [todo] = await db.insert(todos).values(input).returning();
    return todo;
  },

  async update(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const [todo] = await db.update(todos).set(input).where(eq(todos.id, id)).returning();
    return todo ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const deleted = await db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id });
    return deleted.length > 0;
  },
};
