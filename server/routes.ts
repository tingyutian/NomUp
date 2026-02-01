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
      - price: the price as a number
      - quantity: the quantity purchased (default to 1 if not clear)
      - unit: the unit of measurement extracted from the product name or receipt (e.g., "lb", "oz", "kg", "g", "gal", "ct"). If a weight like "1LB" is in the product name, extract "lb" as the unit. Default to "units" only if no measurement is visible.
      - unitAmount: the numeric amount for the unit (e.g., if product says "Cherries 1LB", unitAmount is 1. If "24oz", unitAmount is 24. Default to 1 if unclear)
      
      IMPORTANT: 
      - Only include FOOD items. Exclude non-food items like bags, tax, discounts, store cards, etc.
      - Product names should be clean without weight info (e.g., "Cherries" not "Cherries 1LB")
      - Extract weight/size from the name and put it in unit and unitAmount fields
      
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

  const httpServer = createServer(app);

  return httpServer;
}
