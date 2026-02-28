import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  requestNotificationPermission,
  hasRequestedPermission,
  markPermissionRequested,
  scheduleNotificationsForItems,
  scheduleExpiringItemNotification,
  cancelItemNotification,
} from "@/services/notifications";

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitAmount: number;
  price: number;
  expiresIn: number;
  expirationDate: string;
  storageLocation: "fridge" | "freezer" | "pantry";
  addedAt: string;
  usedAmount: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  addedAt: string;
}

export interface SavedRecipeData {
  id: string;
  recipeId: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
  instructions: string | null;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  ingredients: string[];
  stats: { total: number; matched: number; missing: number } | null;
  enhancedSteps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }> | null;
  savedAt: string;
}

interface AppContextType {
  groceries: GroceryItem[];
  shoppingList: ShoppingListItem[];
  savedRecipes: SavedRecipeData[];
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  addGroceries: (items: GroceryItem[]) => Promise<void>;
  updateGrocery: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteGrocery: (id: string) => Promise<void>;
  useGrocery: (id: string, amount: number) => Promise<void>;
  batchUseGroceries: (
    updates: Array<{ id: string; amount: number }>,
  ) => Promise<void>;
  throwAwayGrocery: (id: string) => Promise<void>;
  addToShoppingList: (
    item: Omit<ShoppingListItem, "id" | "checked" | "addedAt">,
  ) => Promise<void>;
  addMultipleToShoppingList: (
    items: Array<Omit<ShoppingListItem, "id" | "checked" | "addedAt">>,
  ) => Promise<void>;
  removeFromShoppingList: (id: string) => Promise<void>;
  updateShoppingListItem: (
    id: string,
    updates: Partial<ShoppingListItem>,
  ) => Promise<void>;
  toggleShoppingListItem: (id: string) => Promise<void>;
  clearShoppingList: () => Promise<void>;
  saveRecipe: (recipe: any, enhancedSteps?: any[]) => Promise<void>;
  unsaveRecipe: (recipeId: string) => Promise<void>;
  isRecipeSaved: (recipeId: string) => boolean;
  updateRecipeSteps: (recipeId: string, enhancedSteps: any[]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Issue #9: Typed Supabase row shapes (snake_case) ─────────────────────────
// These mirror the Supabase table columns so TypeScript catches renames at
// compile time instead of silently producing `undefined` values in the UI.

interface GroceryRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: string;         // Supabase returns numeric as string
  unit: string;
  unit_amount: string;
  price: string;
  expires_in: number;
  expiration_date: string | Date;
  storage_location: string;
  added_at: string | Date;
  used_amount: string;
}

interface ShoppingRow {
  id: string;
  user_id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  added_at: string | Date;
}

interface RecipeRow {
  id: string;
  user_id: string;
  recipe_id: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
  instructions: string | null;
  match_score: number | null;
  matched_ingredients: string[] | null;
  missing_ingredients: string[] | null;
  ingredients: string[] | null;
  stats: { total: number; matched: number; missing: number } | null;
  enhanced_steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }> | null;
  saved_at: string | Date;
}

// ── Issue #11: Centralised user-facing mutation error notification ─────────────
// Reverts are handled by each caller; this shows the alert and logs the error.
function notifyMutationError(operation: string, error: unknown): void {
  console.error(`Error during ${operation}:`, error);
  Alert.alert(
    "Something went wrong",
    `Could not ${operation}. Your change has been reverted.`,
    [{ text: "OK" }],
  );
}

// ── Row mappers (snake_case DB → camelCase app) ──────────────────────────────

function mapGroceryFromDB(row: GroceryRow): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitAmount: Number(row.unit_amount),
    price: Number(row.price),
    expiresIn: row.expires_in,
    expirationDate:
      row.expiration_date instanceof Date
        ? row.expiration_date.toISOString()
        : row.expiration_date,
    storageLocation: row.storage_location as "fridge" | "freezer" | "pantry",
    addedAt:
      row.added_at instanceof Date
        ? row.added_at.toISOString()
        : row.added_at,
    usedAmount: Number(row.used_amount),
  };
}

function mapGroceryToDB(item: GroceryItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    unit_amount: item.unitAmount,
    price: item.price,
    expires_in: item.expiresIn,
    expiration_date: item.expirationDate,
    storage_location: item.storageLocation,
    added_at: item.addedAt,
    used_amount: item.usedAmount,
  };
}

function mapShoppingFromDB(row: ShoppingRow): ShoppingListItem {
  return {
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    checked: row.checked,
    addedAt:
      row.added_at instanceof Date
        ? row.added_at.toISOString()
        : row.added_at,
  };
}

function mapShoppingToDB(
  item: Omit<ShoppingListItem, "id" | "checked" | "addedAt"> & {
    id?: string;
    checked?: boolean;
    addedAt?: string;
  },
  userId: string,
) {
  return {
    ...(item.id ? { id: item.id } : {}),
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    checked: item.checked ?? false,
    ...(item.addedAt ? { added_at: item.addedAt } : {}),
  };
}

function mapRecipeFromDB(row: RecipeRow): SavedRecipeData {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    name: row.name,
    thumbnail: row.thumbnail ?? null,
    category: row.category ?? null,
    instructions: row.instructions ?? null,
    matchScore: row.match_score ?? 0,
    matchedIngredients: row.matched_ingredients ?? [],
    missingIngredients: row.missing_ingredients ?? [],
    ingredients: row.ingredients ?? [],
    stats: row.stats ?? null,
    enhancedSteps: row.enhanced_steps ?? null,
    savedAt:
      row.saved_at instanceof Date
        ? row.saved_at.toISOString()
        : row.saved_at,
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeData[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadData(userId);
    } else {
      // Clear all data on logout
      setGroceries([]);
      setShoppingList([]);
      setSavedRecipes([]);
      setHasCompletedOnboarding(false);
      setIsLoading(false);
    }
  }, [userId]);

  const loadData = async (uid: string) => {
    setIsLoading(true);
    try {
      const [
        { data: groceriesData },
        { data: shoppingData },
        { data: recipesData },
      ] = await Promise.all([
        supabase
          .from("grocery_items")
          .select("*")
          .order("added_at", { ascending: false }),
        supabase
          .from("shopping_list_items")
          .select("*")
          .order("added_at", { ascending: false }),
        supabase
          .from("saved_recipes")
          .select("*")
          .order("saved_at", { ascending: false }),
      ]);

      if (groceriesData) {
        setGroceries(updateExpirationDays(groceriesData.map(mapGroceryFromDB)));
      }
      if (shoppingData) {
        setShoppingList(shoppingData.map(mapShoppingFromDB));
      }
      if (recipesData) {
        setSavedRecipes(recipesData.map(mapRecipeFromDB));
      }

      // Issue #10: AsyncStorage can fail on restricted or full storage — catch
      // gracefully so a storage error doesn't break the entire data load.
      const onboardingKey = `@nomup_onboarding_${uid}`;
      try {
        const onboardingData = await AsyncStorage.getItem(onboardingKey);
        setHasCompletedOnboarding(onboardingData === "true");
      } catch {
        console.warn("Failed to read onboarding state from AsyncStorage");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpirationDays = (items: GroceryItem[]): GroceryItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.map((item) => {
      const expDate = new Date(item.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...item, expiresIn: diffDays };
    });
  };

  // ── Groceries ──────────────────────────────────────────────────────────────

  const addGroceries = async (items: GroceryItem[]) => {
    if (!userId) return;

    // Optimistic update
    const newGroceries = [...groceries, ...items];
    setGroceries(newGroceries);

    const { error } = await supabase
      .from("grocery_items")
      .insert(items.map((item) => mapGroceryToDB(item, userId)));

    if (error) {
      // Revert on failure and notify the user (Issue #11).
      setGroceries(groceries);
      notifyMutationError("add groceries", error);
      return;
    }

    // Notification logic
    const isFirstAddition = groceries.length === 0;
    if (isFirstAddition) {
      const alreadyRequested = await hasRequestedPermission();
      if (!alreadyRequested) {
        await markPermissionRequested();
        await requestNotificationPermission();
      }
    }
    for (const item of items) {
      if (item.expiresIn > 0 && item.expiresIn <= 5) {
        await scheduleExpiringItemNotification(
          item.name,
          item.expiresIn,
          item.id,
        );
      }
    }
  };

  const updateGrocery = async (id: string, updates: Partial<GroceryItem>) => {
    if (!userId) return;

    // Optimistic update
    const prev = groceries;
    setGroceries(groceries.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    ));

    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.unitAmount !== undefined)
      dbUpdates.unit_amount = updates.unitAmount;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.expiresIn !== undefined) dbUpdates.expires_in = updates.expiresIn;
    if (updates.expirationDate !== undefined)
      dbUpdates.expiration_date = updates.expirationDate;
    if (updates.storageLocation !== undefined)
      dbUpdates.storage_location = updates.storageLocation;
    if (updates.usedAmount !== undefined)
      dbUpdates.used_amount = updates.usedAmount;

    const { error } = await supabase
      .from("grocery_items")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      setGroceries(prev);
      notifyMutationError("update grocery", error);
    }
  };

  const deleteGrocery = async (id: string) => {
    if (!userId) return;

    // Optimistic update
    const prev = groceries;
    setGroceries(groceries.filter((item) => item.id !== id));

    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", id);

    if (error) {
      setGroceries(prev);
      notifyMutationError("delete grocery", error);
      return;
    }

    await cancelItemNotification(id);
  };

  const useGrocery = async (id: string, amount: number) => {
    const item = groceries.find((g) => g.id === id);
    if (!item) return;

    const newUsedAmount = Math.min(item.usedAmount + amount, 10);
    if (newUsedAmount >= 10) {
      await deleteGrocery(id);
    } else {
      await updateGrocery(id, { usedAmount: newUsedAmount });
    }
  };

  const batchUseGroceries = async (
    updates: Array<{ id: string; amount: number }>,
  ) => {
    let updatedGroceries = [...groceries];
    const idsToDelete: string[] = [];

    for (const { id, amount } of updates) {
      const index = updatedGroceries.findIndex((g) => g.id === id);
      if (index === -1) continue;

      const item = updatedGroceries[index];
      const newUsedAmount = Math.min(item.usedAmount + amount, 10);
      if (newUsedAmount >= 10) {
        idsToDelete.push(id);
        updatedGroceries = updatedGroceries.filter((g) => g.id !== id);
      } else {
        updatedGroceries[index] = { ...item, usedAmount: newUsedAmount };
      }
    }

    // Optimistic update
    setGroceries(updatedGroceries);

    // Delete fully-consumed items
    for (const id of idsToDelete) {
      await supabase.from("grocery_items").delete().eq("id", id);
      await cancelItemNotification(id);
    }

    // Update partially-consumed items
    const partial = updates.filter((u) => !idsToDelete.includes(u.id));
    for (const { id, amount } of partial) {
      const item = updatedGroceries.find((g) => g.id === id);
      if (item) {
        await supabase
          .from("grocery_items")
          .update({ used_amount: item.usedAmount })
          .eq("id", id);
      }
    }
  };

  const throwAwayGrocery = async (id: string) => {
    await deleteGrocery(id);
  };

  // ── Shopping list ──────────────────────────────────────────────────────────

  const addToShoppingList = async (
    item: Omit<ShoppingListItem, "id" | "checked" | "addedAt">,
  ) => {
    if (!userId) return;

    const newItem: ShoppingListItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      checked: false,
      addedAt: new Date().toISOString(),
    };

    // Optimistic update
    setShoppingList([...shoppingList, newItem]);

    const { error } = await supabase
      .from("shopping_list_items")
      .insert(mapShoppingToDB(newItem, userId));

    if (error) {
      setShoppingList(shoppingList);
      notifyMutationError("add to shopping list", error);
    }
  };

  const addMultipleToShoppingList = async (
    items: Array<Omit<ShoppingListItem, "id" | "checked" | "addedAt">>,
  ) => {
    if (!userId) return;

    const now = Date.now();
    const newItems: ShoppingListItem[] = items.map((item, index) => ({
      ...item,
      id: `${now}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      checked: false,
      addedAt: new Date().toISOString(),
    }));

    // Optimistic update
    setShoppingList([...shoppingList, ...newItems]);

    const { error } = await supabase
      .from("shopping_list_items")
      .insert(newItems.map((item) => mapShoppingToDB(item, userId)));

    if (error) {
      setShoppingList(shoppingList);
      notifyMutationError("add items to shopping list", error);
    }
  };

  const removeFromShoppingList = async (id: string) => {
    if (!userId) return;

    const prev = shoppingList;
    setShoppingList(shoppingList.filter((item) => item.id !== id));

    const { error } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("id", id);

    if (error) {
      setShoppingList(prev);
      notifyMutationError("remove from shopping list", error);
    }
  };

  const updateShoppingListItem = async (
    id: string,
    updates: Partial<ShoppingListItem>,
  ) => {
    if (!userId) return;

    const prev = shoppingList;
    setShoppingList(shoppingList.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    ));

    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.checked !== undefined) dbUpdates.checked = updates.checked;

    const { error } = await supabase
      .from("shopping_list_items")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      setShoppingList(prev);
      notifyMutationError("update shopping list item", error);
    }
  };

  const toggleShoppingListItem = async (id: string) => {
    const item = shoppingList.find((i) => i.id === id);
    if (!item) return;
    await updateShoppingListItem(id, { checked: !item.checked });
  };

  const clearShoppingList = async () => {
    if (!userId) return;

    const prev = shoppingList;
    setShoppingList([]);

    const { error } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("user_id", userId);

    if (error) {
      setShoppingList(prev);
      notifyMutationError("clear shopping list", error);
    }
  };

  // ── Saved recipes ──────────────────────────────────────────────────────────

  const saveRecipe = async (recipe: any, enhancedSteps?: any[]) => {
    if (!userId) return;

    const existing = savedRecipes.find((r) => r.recipeId === recipe.id);
    if (existing) return;

    const newSavedRecipe: SavedRecipeData = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipeId: recipe.id,
      name: recipe.name,
      thumbnail: recipe.thumbnail || null,
      category: recipe.category || null,
      instructions: recipe.instructions || null,
      matchScore: recipe.matchScore || 0,
      matchedIngredients: recipe.matchedIngredients || [],
      missingIngredients: recipe.missingIngredients || [],
      ingredients: recipe.ingredients || [],
      stats: recipe.stats || null,
      enhancedSteps: enhancedSteps || null,
      savedAt: new Date().toISOString(),
    };

    // Optimistic update
    setSavedRecipes([newSavedRecipe, ...savedRecipes]);

    const { data, error } = await supabase
      .from("saved_recipes")
      .insert({
        user_id: userId,
        recipe_id: recipe.id,
        name: recipe.name,
        thumbnail: recipe.thumbnail || null,
        category: recipe.category || null,
        instructions: recipe.instructions || null,
        match_score: recipe.matchScore || 0,
        matched_ingredients: recipe.matchedIngredients || [],
        missing_ingredients: recipe.missingIngredients || [],
        ingredients: recipe.ingredients || [],
        stats: recipe.stats || null,
        enhanced_steps: enhancedSteps || null,
      })
      .select()
      .single();

    if (error) {
      setSavedRecipes(savedRecipes);
      notifyMutationError("save recipe", error);
    } else if (data) {
      // Replace temp ID with real DB ID
      setSavedRecipes((prev) =>
        prev.map((r) =>
          r.recipeId === recipe.id ? mapRecipeFromDB(data) : r,
        ),
      );
    }
  };

  const unsaveRecipe = async (recipeId: string) => {
    if (!userId) return;

    const prev = savedRecipes;
    setSavedRecipes(savedRecipes.filter((r) => r.recipeId !== recipeId));

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("user_id", userId);

    if (error) {
      setSavedRecipes(prev);
      notifyMutationError("remove saved recipe", error);
    }
  };

  const isRecipeSaved = (recipeId: string) => {
    return savedRecipes.some((r) => r.recipeId === recipeId);
  };

  const updateRecipeSteps = async (recipeId: string, enhancedSteps: any[]) => {
    if (!userId) return;

    setSavedRecipes(savedRecipes.map((r) =>
      r.recipeId === recipeId ? { ...r, enhancedSteps } : r,
    ));

    const { error } = await supabase
      .from("saved_recipes")
      .update({ enhanced_steps: enhancedSteps })
      .eq("recipe_id", recipeId)
      .eq("user_id", userId);

    if (error) {
      // No optimistic revert for steps (low-risk); still surface the failure.
      console.error("Error updating recipe steps:", error);
      Alert.alert("Something went wrong", "Could not save updated steps.", [{ text: "OK" }]);
    }
  };

  // ── Onboarding ─────────────────────────────────────────────────────────────

  const completeOnboarding = async () => {
    if (!userId) return;
    const onboardingKey = `@nomup_onboarding_${userId}`;
    // Issue #10: Wrap write in try-catch; still update in-memory state even if
    // persistence fails so the user can continue without being stuck on onboarding.
    try {
      await AsyncStorage.setItem(onboardingKey, "true");
    } catch {
      console.warn("Failed to persist onboarding state to AsyncStorage");
    }
    setHasCompletedOnboarding(true);
  };

  const refreshData = async () => {
    if (userId) await loadData(userId);
  };

  return (
    <AppContext.Provider
      value={{
        groceries,
        shoppingList,
        savedRecipes,
        hasCompletedOnboarding,
        isLoading,
        addGroceries,
        updateGrocery,
        deleteGrocery,
        useGrocery,
        batchUseGroceries,
        throwAwayGrocery,
        addToShoppingList,
        addMultipleToShoppingList,
        removeFromShoppingList,
        updateShoppingListItem,
        toggleShoppingListItem,
        clearShoppingList,
        saveRecipe,
        unsaveRecipe,
        isRecipeSaved,
        updateRecipeSteps,
        completeOnboarding,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
