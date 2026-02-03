import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface ScannedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  expiresIn: number;
  unit: string;
  unitAmount: number;
}

function mergeDuplicateItems(items: ScannedItem[]): ScannedItem[] {
  const itemMap = new Map<string, ScannedItem>();
  
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    
    if (itemMap.has(key)) {
      const existing = itemMap.get(key)!;
      existing.quantity += item.quantity;
      existing.price += item.price;
    } else {
      itemMap.set(key, { ...item });
    }
  }
  
  return Array.from(itemMap.values());
}

const categoryExpirationDefaults: Record<string, number> = {
  produce: 5,
  dairy: 14,
  bakery: 3,
  meat: 5,
  pantry: 90,
  frozen: 180,
  beverages: 30,
};

function getDefaultExpiration(category: string): number {
  return categoryExpirationDefaults[category.toLowerCase()] || 7;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/scan-receipt", async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const prompt = `Analyze this grocery receipt image and extract grocery items. 
      For each item, identify:
      - name: the product name ONLY (clean it up, remove store codes, and REMOVE any weight/size info like "1LB", "12oz", "2kg" from the name)
      - category: one of: Produce, Dairy, Bakery, Meat, Pantry, Frozen, Beverages
      - price: the LINE TOTAL - the actual dollar amount paid for this item as shown on the receipt. This is NOT the unit price. For example, if the receipt shows "2 x Apples @ $1.50 = $3.00", the price should be 3.00 (the total paid), not 1.50.
      - quantity: the quantity purchased (default to 1 if not clear)
      - unit: the unit of measurement extracted from the product name or receipt (e.g., "lb", "oz", "kg", "g", "gal", "ct"). If a weight like "1LB" is in the product name, extract "lb" as the unit. Default to "units" only if no measurement is visible.
      - unitAmount: the numeric amount for the unit (e.g., if product says "Cherries 1LB", unitAmount is 1. If "24oz", unitAmount is 24. Default to 1 if unclear)
      
      IMPORTANT: 
      - Only include FOOD items. Exclude non-food items like bags, tax, discounts, store cards, etc.
      - Product names should be clean without weight info (e.g., "Cherries" not "Cherries 1LB")
      - Extract weight/size from the name and put it in unit and unitAmount fields
      - The price field must be the LINE TOTAL (amount actually charged), not a per-unit price
      
      Return ONLY a valid JSON array of items with this structure:
      [{"name": "...", "category": "...", "price": 0.00, "quantity": 1, "unit": "lb", "unitAmount": 1}]
      
      If you cannot identify any items, return an empty array: []`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || "";
      
      let items: ScannedItem[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          items = parsed.map((item: any, index: number) => ({
            id: `${Date.now()}-${index}`,
            name: item.name || "Unknown Item",
            category: item.category || "Pantry",
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || "units",
            unitAmount: parseFloat(item.unitAmount) || 1,
            expiresIn: getDefaultExpiration(item.category || "Pantry"),
          }));
          
          items = mergeDuplicateItems(items);
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        items = [];
      }

      res.json({ items });
    } catch (error) {
      console.error("Error scanning receipt:", error);
      res.status(500).json({ error: "Failed to scan receipt" });
    }
  });

  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const prompt = `Analyze this food image and identify the ingredients that were likely used to make this dish or that are visible in the image.
      
      For each ingredient, provide:
      - name: the ingredient name
      - category: one of: Produce, Dairy, Bakery, Meat, Pantry, Frozen, Beverages
      
      Return ONLY a valid JSON array:
      [{"name": "...", "category": "..."}]
      
      If you cannot identify any ingredients, return an empty array: []`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || "";
      
      let ingredients: { name: string; category: string }[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ingredients = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        ingredients = [];
      }

      res.json({ ingredients });
    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ error: "Failed to analyze food" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Recipe discovery endpoints
  app.get("/api/recipes/by-ingredient/:itemName", async (req, res) => {
    try {
      const { itemName } = req.params;
      const pantryJson = req.query.pantry as string;
      
      if (!pantryJson) {
        return res.status(400).json({ error: "Pantry data is required" });
      }

      const userPantry = JSON.parse(pantryJson) as Array<{ name: string; category: string }>;
      
      // 1. Fetch from TheMealDB
      const mealDbUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(itemName)}`;
      const mealResponse = await fetch(mealDbUrl);
      const mealData = await mealResponse.json();
      
      if (!mealData.meals) {
        return res.json({ recipes: [] });
      }

      // 2. Get full recipe details (includes ingredients & instructions)
      // Limit to 8 recipes to keep API response fast
      const mealsToFetch = mealData.meals.slice(0, 8);
      console.log(`Fetching ${mealsToFetch.length} recipe details...`);
      
      const recipePromises = mealsToFetch.map(async (meal: any) => {
        try {
          const detailUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`;
          const detailResponse = await fetch(detailUrl);
          const detailData = await detailResponse.json();
          const fullMeal = detailData.meals?.[0];
          
          if (!fullMeal) return null;

          // Extract ingredients from strIngredient1-20
          const ingredients: string[] = [];
          for (let i = 1; i <= 20; i++) {
            const ingredient = fullMeal[`strIngredient${i}`];
            if (ingredient?.trim()) {
              ingredients.push(ingredient.trim());
            }
          }

          return {
            id: fullMeal.idMeal,
            name: fullMeal.strMeal,
            thumbnail: fullMeal.strMealThumb,
            category: fullMeal.strCategory,
            instructions: fullMeal.strInstructions,
            ingredients,
          };
        } catch (err) {
          console.error(`Error fetching recipe ${meal.idMeal}:`, err);
          return null;
        }
      });

      const recipes = (await Promise.all(recipePromises)).filter(Boolean);
      console.log(`Fetched ${recipes.length} recipes successfully`);

      if (recipes.length === 0) {
        return res.json({ recipes: [] });
      }

      // 3. Score recipes with Gemini
      const pantryNames = userPantry.map((item) => item.name);
      
      const prompt = `You are a cooking ingredient matcher. Match user's pantry items to recipe ingredients.

USER'S PANTRY: ${pantryNames.join(", ")}

RECIPES:
${recipes.map((r: any, i: number) => `${i + 1}. ${r.name}: ${r.ingredients.join(", ")}`).join("\n")}

For each recipe, determine which ingredients the user HAS (from their pantry) and which they are MISSING.

Matching rules:
- Exact match counts (chicken = chicken)
- Generic matches count (chicken breast matches chicken, ground beef matches beef)
- Substitutable ingredients count (chicken thigh ~ chicken drumstick)
- Different items don't match (chicken ≠ chickpeas, butter ≠ peanut butter)
- Common pantry staples like salt, pepper, water, oil can be assumed as matched

Return ONLY valid JSON array (no markdown, no explanation):
[{"recipeIndex": 1, "matched": ["ingredient1", "ingredient2"], "missing": ["ingredient3"]}]`;

      console.log("Calling Gemini for ingredient matching...");
      let responseText = "[]";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        responseText = response.text || "[]";
        console.log("Gemini response received");
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // If Gemini fails, return recipes without scoring
      }

      let scoringResults: Array<{ recipeIndex: number; matched: string[]; missing: string[] }> = [];
      
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          scoringResults = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing Gemini scoring response:", parseError);
      }

      // 4. Combine recipe data with scoring
      const scoredRecipes = recipes.map((recipe: any, index: number) => {
        const scoreData = scoringResults.find((r) => r.recipeIndex === index + 1);
        const matched = scoreData?.matched || [];
        const missing = scoreData?.missing || recipe.ingredients;
        const totalIngredients = recipe.ingredients.length;
        const matchedCount = matched.length;
        const matchScore = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

        return {
          ...recipe,
          matchScore,
          matchedIngredients: matched,
          missingIngredients: missing,
          stats: {
            total: totalIngredients,
            matched: matchedCount,
            missing: missing.length,
          },
        };
      });

      // 5. Sort by match score (highest first)
      scoredRecipes.sort((a: any, b: any) => b.matchScore - a.matchScore);

      res.json({ recipes: scoredRecipes });
    } catch (error) {
      console.error("Recipe fetch error:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
