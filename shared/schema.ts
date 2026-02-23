import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: The users table is managed by Supabase Auth (auth.users).
// This Drizzle schema covers application tables only.

// Saved recipes — user_id references Supabase's auth.users(id)
export const savedRecipes = pgTable("saved_recipes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  recipeId: varchar("recipe_id").notNull(),
  name: text("name").notNull(),
  thumbnail: text("thumbnail"),
  category: text("category"),
  instructions: text("instructions"),
  matchScore: integer("match_score").default(0),
  matchedIngredients: jsonb("matched_ingredients").$type<string[]>().default([]),
  missingIngredients: jsonb("missing_ingredients").$type<string[]>().default([]),
  ingredients: jsonb("ingredients").$type<string[]>().default([]),
  stats: jsonb("stats").$type<{
    total: number;
    matched: number;
    missing: number;
  }>(),
  enhancedSteps: jsonb("enhanced_steps").$type<
    Array<{
      stepNumber: number;
      instruction: string;
      duration?: number;
      temperature?: string;
    }>
  >(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertSavedRecipeSchema = createInsertSchema(savedRecipes).omit({
  id: true,
  savedAt: true,
});

export type InsertSavedRecipe = z.infer<typeof insertSavedRecipeSchema>;
export type SavedRecipe = typeof savedRecipes.$inferSelect;

// Grocery items
export const groceryItems = pgTable("grocery_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  unit: text("unit").notNull().default("units"),
  unitAmount: numeric("unit_amount").notNull().default("1"),
  price: numeric("price").notNull().default("0"),
  expiresIn: integer("expires_in").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  storageLocation: text("storage_location").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  usedAmount: numeric("used_amount").notNull().default("0"),
});

// Shopping list items
export const shoppingListItems = pgTable("shopping_list_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  unit: text("unit").notNull().default("units"),
  checked: boolean("checked").notNull().default(false),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  defaultStorage: text("default_storage").default("fridge"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
