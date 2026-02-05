import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Saved recipes table
export const savedRecipes = pgTable("saved_recipes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull(),
  name: text("name").notNull(),
  thumbnail: text("thumbnail"),
  category: text("category"),
  instructions: text("instructions"),
  matchScore: integer("match_score").default(0),
  matchedIngredients: jsonb("matched_ingredients").$type<string[]>().default([]),
  missingIngredients: jsonb("missing_ingredients").$type<string[]>().default([]),
  ingredients: jsonb("ingredients").$type<string[]>().default([]),
  stats: jsonb("stats").$type<{ total: number; matched: number; missing: number }>(),
  enhancedSteps: jsonb("enhanced_steps").$type<Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }>>(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertSavedRecipeSchema = createInsertSchema(savedRecipes).omit({
  id: true,
  savedAt: true,
});

export type InsertSavedRecipe = z.infer<typeof insertSavedRecipeSchema>;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
