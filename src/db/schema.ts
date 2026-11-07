// 数据库表结构定义。改了这里之后要跑 npm run db:generate 生成迁移，再 npm run db:migrate 执行。

import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// Better Auth 的 user / session / account / verification 表，由 `npx auth generate` 生成，不要手改
export * from "./auth-schema";

export const todos = pgTable(
  "todos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 所属用户。阶段 4 接入鉴权后写入；Better Auth 的用户 id 是 text 类型
    userId: text("user_id"),
    title: varchar("title", { length: 200 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  // 查询总是按用户过滤，给 user_id 建索引
  (t) => [index("todos_user_id_idx").on(t.userId)],
);

export type Todo = typeof todos.$inferSelect;
