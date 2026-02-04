import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

interface AppContextType {
  groceries: GroceryItem[];
  shoppingList: ShoppingListItem[];
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  addGroceries: (items: GroceryItem[]) => Promise<void>;
  updateGrocery: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteGrocery: (id: string) => Promise<void>;
  useGrocery: (id: string, amount: number) => Promise<void>;
  throwAwayGrocery: (id: string) => Promise<void>;
  addToShoppingList: (item: Omit<ShoppingListItem, "id" | "checked" | "addedAt">) => Promise<void>;
  addMultipleToShoppingList: (items: Array<Omit<ShoppingListItem, "id" | "checked" | "addedAt">>) => Promise<void>;
  removeFromShoppingList: (id: string) => Promise<void>;
  updateShoppingListItem: (id: string, updates: Partial<ShoppingListItem>) => Promise<void>;
  toggleShoppingListItem: (id: string) => Promise<void>;
  clearShoppingList: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GROCERIES: "@nomup_groceries",
  SHOPPING_LIST: "@nomup_shopping_list",
  ONBOARDING: "@nomup_onboarding_complete",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groceriesData, shoppingListData, onboardingData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.GROCERIES),
        AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
      ]);

      if (groceriesData) {
        const parsed = JSON.parse(groceriesData);
        const updated = updateExpirationDays(parsed);
        setGroceries(updated);
      }
      if (shoppingListData) {
        setShoppingList(JSON.parse(shoppingListData));
      }
      if (onboardingData === "true") {
        setHasCompletedOnboarding(true);
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
    
    return items.map(item => {
      const expDate = new Date(item.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...item, expiresIn: diffDays };
    });
  };

  const saveGroceries = async (items: GroceryItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GROCERIES, JSON.stringify(items));
    setGroceries(items);
  };

  const saveShoppingList = async (items: ShoppingListItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
    setShoppingList(items);
  };

  const addGroceries = async (items: GroceryItem[]) => {
    const isFirstAddition = groceries.length === 0;
    const newGroceries = [...groceries, ...items];
    await saveGroceries(newGroceries);

    if (isFirstAddition) {
      const alreadyRequested = await hasRequestedPermission();
      if (!alreadyRequested) {
        await markPermissionRequested();
        await requestNotificationPermission();
      }
    }

    for (const item of items) {
      if (item.expiresIn > 0 && item.expiresIn <= 5) {
        await scheduleExpiringItemNotification(item.name, item.expiresIn, item.id);
      }
    }
  };

  const updateGrocery = async (id: string, updates: Partial<GroceryItem>) => {
    const updated = groceries.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    await saveGroceries(updated);
  };

  const deleteGrocery = async (id: string) => {
    const filtered = groceries.filter(item => item.id !== id);
    await saveGroceries(filtered);
    await cancelItemNotification(id);
  };

  const useGrocery = async (id: string, amount: number) => {
    const item = groceries.find(g => g.id === id);
    if (!item) return;

    const newUsedAmount = Math.min(item.usedAmount + amount, 10);
    if (newUsedAmount >= 10) {
      await deleteGrocery(id);
    } else {
      await updateGrocery(id, { usedAmount: newUsedAmount });
    }
  };

  const throwAwayGrocery = async (id: string) => {
    await deleteGrocery(id);
  };

  const addToShoppingList = async (item: Omit<ShoppingListItem, "id" | "checked" | "addedAt">) => {
    const newItem: ShoppingListItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    const newList = [...shoppingList, newItem];
    await saveShoppingList(newList);
  };

  const addMultipleToShoppingList = async (items: Array<Omit<ShoppingListItem, "id" | "checked" | "addedAt">>) => {
    const now = Date.now();
    const newItems: ShoppingListItem[] = items.map((item, index) => ({
      ...item,
      id: `${now}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      checked: false,
      addedAt: new Date().toISOString(),
    }));
    const newList = [...shoppingList, ...newItems];
    await saveShoppingList(newList);
  };

  const removeFromShoppingList = async (id: string) => {
    const filtered = shoppingList.filter(item => item.id !== id);
    await saveShoppingList(filtered);
  };

  const updateShoppingListItem = async (id: string, updates: Partial<ShoppingListItem>) => {
    const updated = shoppingList.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    await saveShoppingList(updated);
  };

  const toggleShoppingListItem = async (id: string) => {
    const updated = shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await saveShoppingList(updated);
  };

  const clearShoppingList = async () => {
    await saveShoppingList([]);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
    setHasCompletedOnboarding(true);
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        groceries,
        shoppingList,
        hasCompletedOnboarding,
        isLoading,
        addGroceries,
        updateGrocery,
        deleteGrocery,
        useGrocery,
        throwAwayGrocery,
        addToShoppingList,
        addMultipleToShoppingList,
        removeFromShoppingList,
        updateShoppingListItem,
        toggleShoppingListItem,
        clearShoppingList,
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
