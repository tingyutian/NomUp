import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const GEMINI_MODEL = "gemini-3-flash-preview";

interface ExpiringIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  daysUntilExpiration: number;
}

interface GeneratedRecipe {
  id: string;
  title: string;
  totalTime: number;
  servings: number;
  matchScore: number;
  thumbnail?: string;
  usedIngredients: Array<{
    groceryItemId: string;
    name: string;
    amount: string;
    prepNotes?: string;
  }>;
  missingIngredients: Array<{
    name: string;
    amount: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }>;
}

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      totalTime: { type: Type.NUMBER },
      servings: { type: Type.NUMBER },
      matchScore: { type: Type.NUMBER },
      usedIngredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            groceryItemId: { type: Type.STRING },
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
            prepNotes: { type: Type.STRING },
          },
          required: ["groceryItemId", "name", "amount"],
        },
      },
      missingIngredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
          },
          required: ["name", "amount"],
        },
      },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepNumber: { type: Type.NUMBER },
            instruction: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            temperature: { type: Type.STRING },
          },
          required: ["stepNumber", "instruction"],
        },
      },
    },
    required: ["title", "totalTime", "servings", "matchScore", "usedIngredients", "missingIngredients", "steps"],
  },
};

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

async function generateRecipesWithGemini(
  expiringIngredients: ExpiringIngredient[],
  pantryItems: Array<{ name: string; category: string }>,
  maxCookingTime?: number
): Promise<any[]> {
  const ingredientList = expiringIngredients
    .map(i => `- ${i.name} (${i.quantity} ${i.unit}, expires in ${i.daysUntilExpiration} days)`)
    .join("\n");

  const pantryList = pantryItems.map(p => p.name).join(", ");

  const timeConstraint = maxCookingTime 
    ? `- Maximum cooking time: ${maxCookingTime} minutes` 
    : "- Cooking time: reasonable for home cooking (under 60 minutes preferred)";

  const prompt = `Generate exactly 2 recipes using these expiring ingredients. Prioritize items expiring soonest.

EXPIRING INGREDIENTS (MUST USE):
${ingredientList}

OTHER PANTRY ITEMS AVAILABLE:
${pantryList}

CONSTRAINTS:
${timeConstraint}
- Skill level: beginner to intermediate
- Minimize additional ingredients needed
- Provide clear step-by-step instructions

For each recipe, provide:
- title: recipe name
- totalTime: total cooking time in minutes
- servings: number of servings
- matchScore: percentage (0-100) of expiring ingredients used
- usedIngredients: array of ingredients from the expiring list with groceryItemId, name, amount, and optional prepNotes
- missingIngredients: array of additional ingredients needed with name and amount
- steps: array of cooking steps with stepNumber, instruction, optional duration in minutes, and optional temperature

Return the recipes as a JSON array.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    },
  });

  const text = response.text || "";
  let recipes: any[] = [];

  try {
    recipes = JSON.parse(text);
    recipes = recipes.map((recipe: any, index: number) => ({
      ...recipe,
      id: `ai-${Date.now()}-${index}`,
      thumbnail: null,
      source: "ai",
      ingredients: recipe.usedIngredients.map((i: any) => i.name),
      matchedIngredients: recipe.usedIngredients.map((i: any) => i.name),
      stats: {
        total: recipe.usedIngredients.length + recipe.missingIngredients.length,
        matched: recipe.usedIngredients.length,
        missing: recipe.missingIngredients.length,
      },
    }));
  } catch (parseError) {
    console.error("Error parsing Gemini recipe response:", parseError);
    recipes = [];
  }

  return recipes;
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
        model: GEMINI_MODEL,
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
        model: GEMINI_MODEL,
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

  // Generate recipes from expiring ingredients using Gemini 3
  app.post("/api/generate-recipe", async (req, res) => {
    try {
      const { expiringIngredients, maxCookingTime, pantryItems = [] } = req.body;

      if (!expiringIngredients || !Array.isArray(expiringIngredients) || expiringIngredients.length === 0) {
        return res.status(400).json({ error: "At least one expiring ingredient is required" });
      }

      console.log(`Generating recipes for ${expiringIngredients.length} expiring ingredients...`);

      const recipes = await generateRecipesWithGemini(
        expiringIngredients,
        pantryItems,
        maxCookingTime
      );

      res.json({ recipes, source: "ai" });
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ error: "Failed to generate recipes" });
    }
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
      
      // 1. Simplify ingredient name - use lookup table first, then AI as fallback
      const ingredientLookup: Record<string, string> = {
        "chicken breast": "chicken", "boneless chicken breast": "chicken", "chicken thigh": "chicken",
        "chicken drumstick": "chicken", "chicken wing": "chicken", "ground chicken": "chicken",
        "ground beef": "beef", "beef steak": "beef", "sirloin": "beef", "ribeye": "beef",
        "ground turkey": "turkey", "turkey breast": "turkey",
        "ground pork": "pork", "pork chop": "pork", "pork loin": "pork", "bacon": "pork",
        "salmon fillet": "salmon", "salmon steak": "salmon",
        "shrimp": "shrimp", "prawns": "shrimp",
        "large eggs": "eggs", "medium eggs": "eggs", "cage free eggs": "eggs",
        "whole milk": "milk", "2% milk": "milk", "skim milk": "milk",
        "cheddar cheese": "cheese", "mozzarella": "cheese", "parmesan": "cheese",
        "roma tomatoes": "tomatoes", "cherry tomatoes": "tomatoes", "diced tomatoes": "tomatoes",
        "russet potatoes": "potatoes", "red potatoes": "potatoes", "yukon gold": "potatoes",
        "yellow onion": "onion", "red onion": "onion", "white onion": "onion",
        "garlic cloves": "garlic", "minced garlic": "garlic",
        "bell pepper": "pepper", "red pepper": "pepper", "green pepper": "pepper",
        "persian limes": "lime", "key limes": "lime",
        "meyer lemons": "lemon", "organic lemons": "lemon",
        "baby spinach": "spinach", "fresh spinach": "spinach",
        "romaine lettuce": "lettuce", "iceberg lettuce": "lettuce",
        "white rice": "rice", "brown rice": "rice", "jasmine rice": "rice", "basmati rice": "rice",
        "spaghetti": "pasta", "penne": "pasta", "fettuccine": "pasta", "linguine": "pasta",
        "olive oil": "olive oil", "vegetable oil": "oil", "canola oil": "oil",
        "butter": "butter", "unsalted butter": "butter", "salted butter": "butter",
        "all purpose flour": "flour", "bread flour": "flour", "wheat flour": "flour",
        "brown sugar": "sugar", "white sugar": "sugar", "cane sugar": "sugar",
        "impossible burger": "burger", "beyond burger": "burger",
      };
      
      const lowerItemName = itemName.toLowerCase();
      let searchTerm = ingredientLookup[lowerItemName];
      
      if (!searchTerm) {
        // Check if item contains a known ingredient
        for (const [key, value] of Object.entries(ingredientLookup)) {
          if (lowerItemName.includes(key) || key.includes(lowerItemName)) {
            searchTerm = value;
            break;
          }
        }
      }
      
      // If not in lookup, use AI as fallback
      if (!searchTerm) {
        try {
          const simplifyPrompt = `Simplify this grocery item to a basic ingredient for recipe search: "${itemName}". Return ONLY the single-word base ingredient (e.g., "Boneless Chicken Breast" → "chicken"). One word only.`;
          const simplifyResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: simplifyPrompt }] }],
          });
          const simplifiedName = simplifyResponse.text?.trim().toLowerCase();
          if (simplifiedName && simplifiedName.length > 0 && simplifiedName.length < 20) {
            searchTerm = simplifiedName;
          }
        } catch (simplifyError) {
          searchTerm = lowerItemName.split(" ").pop() || lowerItemName; // Use last word as fallback
        }
      }
      
      console.log(`Ingredient lookup: "${itemName}" → "${searchTerm}"`);
      
      // 2. Fetch from TheMealDB
      const mealDbUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(searchTerm)}`;
      const mealResponse = await fetch(mealDbUrl);
      const mealData = await mealResponse.json();
      
      if (!mealData.meals) {
        // Fallback to Gemini-generated recipes when TheMealDB has no results
        console.log(`No recipes in TheMealDB for "${searchTerm}", falling back to Gemini...`);
        try {
          const fallbackRecipes = await generateRecipesWithGemini([{
            id: "fallback",
            name: itemName,
            quantity: 1,
            unit: "units",
            daysUntilExpiration: 3,
          }], userPantry, 30);
          
          if (fallbackRecipes.length > 0) {
            return res.json({ recipes: fallbackRecipes, source: "ai" });
          }
        } catch (geminiError) {
          console.error("Gemini fallback failed:", geminiError);
        }
        return res.json({ recipes: [] });
      }

      // 2. Get full recipe details (includes ingredients & instructions)
      // Limit to 5 recipes for faster response
      const mealsToFetch = mealData.meals.slice(0, 5);
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

      // 3. Score recipes with fast local matching (no AI call)
      const pantryNames = userPantry.map((item) => item.name.toLowerCase());
      const commonStaples = ["salt", "pepper", "water", "oil", "olive oil", "vegetable oil", "sugar", "flour"];
      
      // Helper to check if pantry has an ingredient (fuzzy match)
      const pantryHasIngredient = (ingredient: string): boolean => {
        const ing = ingredient.toLowerCase();
        // Check if it's a common staple
        if (commonStaples.some(s => ing.includes(s))) return true;
        // Check pantry items
        return pantryNames.some(p => {
          // Exact match
          if (p === ing || ing === p) return true;
          // Partial match (chicken matches chicken breast)
          if (p.includes(ing) || ing.includes(p)) return true;
          // Word match (e.g., "boneless chicken breast" contains "chicken")
          const pWords = p.split(" ");
          const ingWords = ing.split(" ");
          return pWords.some(pw => ingWords.some(iw => pw === iw && pw.length > 3));
        });
      };

      console.log("Scoring recipes with local matching...");
      
      // 4. Combine recipe data with scoring
      const scoredRecipes = recipes.map((recipe: any) => {
        const matched: string[] = [];
        const missing: string[] = [];
        
        for (const ingredient of recipe.ingredients) {
          if (pantryHasIngredient(ingredient)) {
            matched.push(ingredient);
          } else {
            missing.push(ingredient);
          }
        }
        
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

  // Enhance recipe instructions using Gemini
  app.post("/api/enhance-instructions", async (req, res) => {
    try {
      const { instructions, recipeName } = req.body;

      if (!instructions || typeof instructions !== "string") {
        return res.status(400).json({ error: "Instructions are required" });
      }

      console.log(`Enhancing instructions for "${recipeName}"...`);

      const enhanceSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepNumber: { type: Type.NUMBER },
            instruction: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            temperature: { type: Type.STRING },
          },
          required: ["stepNumber", "instruction"],
        },
      };

      const prompt = `You are a cooking assistant. Transform these recipe instructions into clear, structured cooking steps.

RECIPE: ${recipeName || "Unknown Recipe"}

ORIGINAL INSTRUCTIONS:
${instructions}

For each step:
1. Write a clear, actionable instruction (1-2 sentences max)
2. ONLY include "duration" if an EXPLICIT time is stated (e.g., "cook for 5 minutes", "simmer 30 min", "bake 1 hour")
3. Extract any temperature mentioned (e.g., "350°F", "180°C", "medium-high heat")

CRITICAL RULES FOR DURATION:
- ONLY add duration when the original text contains a specific number of minutes/seconds/hours
- Do NOT estimate or guess times for vague phrases like "until golden", "until done", "until soft"
- Do NOT add duration to steps like "preheat oven", "mix ingredients", "chop vegetables", "serve"
- Convert hours to minutes (1 hour = 60 minutes)
- Most steps should NOT have a duration - only include it when a number is explicitly stated

Return a JSON array of steps.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: enhanceSchema,
        },
      });

      const text = response.text || "";
      let steps: any[] = [];

      try {
        steps = JSON.parse(text);
        // Ensure stepNumber is sequential
        steps = steps.map((step: any, index: number) => ({
          stepNumber: index + 1,
          instruction: step.instruction,
          duration: step.duration || undefined,
          temperature: step.temperature || undefined,
        }));
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        // Fallback to basic parsing
        steps = instructions
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .map((line: string, index: number) => ({
            stepNumber: index + 1,
            instruction: line.replace(/^(step\s*)?(\d+[\.\)\:]?\s*)/i, "").trim(),
          }));
      }

      console.log(`Enhanced into ${steps.length} steps`);
      res.json({ steps });
    } catch (error) {
      console.error("Error enhancing instructions:", error);
      res.status(500).json({ error: "Failed to enhance instructions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
