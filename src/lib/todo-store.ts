// 数据访问层（Repository）。
// 每个方法第一个参数都是 userId，所有查询都带上 user_id = 当前用户 的条件：
// 别人的 todo 对当前用户来说就是"不存在"，查不到、改不了、删不掉。

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

// "这一条 todo，并且属于这个用户"
function owned(userId: string, id: string) {
  return and(eq(todos.id, id), eq(todos.userId, userId));
}

export const todoStore = {
  async list(userId: string, filter: ListTodoFilter = {}): Promise<Todo[]> {
    const conditions: SQL[] = [eq(todos.userId, userId)];
    if (filter.completed !== undefined) conditions.push(eq(todos.completed, filter.completed));
    if (filter.q) conditions.push(ilike(todos.title, `%${escapeLike(filter.q)}%`));

    return db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdAt));
  },

  async get(userId: string, id: string): Promise<Todo | null> {
    const [todo] = await db.select().from(todos).where(owned(userId, id));
    return todo ?? null;
  },

  async create(userId: string, input: CreateTodoInput): Promise<Todo> {
    const [todo] = await db
      .insert(todos)
      .values({ ...input, userId })
      .returning();
    return todo;
  },

  async update(userId: string, id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const [todo] = await db.update(todos).set(input).where(owned(userId, id)).returning();
    return todo ?? null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const deleted = await db
      .delete(todos)
      .where(owned(userId, id))
      .returning({ id: todos.id });
    return deleted.length > 0;
  },
};
