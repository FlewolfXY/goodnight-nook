import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const nookStates = sqliteTable("nook_states", {
  userId: text("user_id").primaryKey(),
  version: integer("version").notNull().default(1),
  paper: integer("paper", { mode: "boolean" }).notNull().default(false),
  souvenirs: integer("souvenirs").notNull().default(0),
  pillow: integer("pillow", { mode: "boolean" }).notNull().default(false),
  pillowWelcomed: integer("pillow_welcomed", { mode: "boolean" }).notNull().default(false),
  pillowPlace: text("pillow_place", { enum: ["newton", "wolf"] }).notNull().default("newton"),
  createdAt: text("created_at").notNull(),
  pillowMadeAt: text("pillow_made_at"),
  updatedAt: text("updated_at").notNull(),
  revision: integer("revision").notNull().default(0),
}, (table) => [
  check("nook_version_v1", sql`${table.version} = 1`),
  check("nook_paper_boolean", sql`${table.paper} IN (0, 1)`),
  check("nook_pillow_boolean", sql`${table.pillow} IN (0, 1)`),
  check("nook_welcomed_boolean", sql`${table.pillowWelcomed} IN (0, 1)`),
  check("nook_pillow_place", sql`${table.pillowPlace} IN ('newton', 'wolf')`),
  check("nook_welcomed_requires_pillow", sql`${table.pillowWelcomed} = 0 OR ${table.pillow} = 1`),
  check("nook_made_at_matches_pillow", sql`(${table.pillow} = 0 AND ${table.pillowMadeAt} IS NULL) OR (${table.pillow} = 1 AND ${table.pillowMadeAt} IS NOT NULL)`),
  check("nook_revision_nonnegative", sql`${table.revision} >= 0`),
]);
