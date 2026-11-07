// 数据访问层（Repository）。
// 现在是内存实现；第二步接数据库时只需把这里换成 ORM 调用，
// Route Handler 不用改 —— 这就是把"存储"和"HTTP"分开的意义。

import { randomUUID } from "node:crypto";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoInput = { title: string; completed?: boolean };
export type UpdateTodoInput = { title?: string; completed?: boolean };
export type ListTodoFilter = { completed?: boolean; q?: string };

// 开发模式下热更新会重新执行模块，挂在 globalThis 上避免数据被清空。
const globalForStore = globalThis as unknown as { todos?: Map<string, Todo> };
const todos = (globalForStore.todos ??= seed());

function seed(): Map<string, Todo> {
  const now = new Date().toISOString();
  const items: Todo[] = [
    { id: randomUUID(), title: "学习 Route Handler", completed: true, createdAt: now, updatedAt: now },
    { id: randomUUID(), title: "接入数据库和 ORM", completed: false, createdAt: now, updatedAt: now },
  ];
  return new Map(items.map((t) => [t.id, t]));
}

// 方法都写成 async：以后换成数据库查询时签名不变。
export const todoStore = {
  async list(filter: ListTodoFilter = {}): Promise<Todo[]> {
    let result = [...todos.values()];
    if (filter.completed !== undefined) {
      result = result.filter((t) => t.completed === filter.completed);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Todo | null> {
    return todos.get(id) ?? null;
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: input.title,
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now,
    };
    todos.set(todo.id, todo);
    return todo;
  },

  async update(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const existing = todos.get(id);
    if (!existing) return null;
    const updated: Todo = { ...existing, ...input, updatedAt: new Date().toISOString() };
    todos.set(id, updated);
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    return todos.delete(id);
  },
};
