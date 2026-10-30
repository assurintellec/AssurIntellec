import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const visitTotals = sqliteTable('visit_totals', {
  identity: text('identity').primaryKey(),
  visits: integer('visits').notNull().default(0),
});
export const visitSessions = sqliteTable('visit_sessions', {
  identity: text('identity').notNull(),
  token: text('token').notNull(),
  expires: integer('expires').notNull(),
  receipt: text('receipt').notNull(),
}, table => [primaryKey({ columns: [table.identity, table.token] }), index('visit_sessions_expiry').on(table.expires)]);
