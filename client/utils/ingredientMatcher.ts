import type { GroceryItem } from "@/context/AppContext";

const COMMON_STAPLES = [
  "salt",
  "pepper",
  "water",
  "oil",
  "olive oil",
  "vegetable oil",
  "sugar",
  "flour",
];

function pantryHasIngredient(
  ingredient: string,
  pantryNames: string[]
): boolean {
  const ing = ingredient.toLowerCase();
  if (COMMON_STAPLES.some((s) => ing.includes(s))) return true;
  return pantryNames.some((p) => {
    if (p === ing) return true;
    if (p.includes(ing) || ing.includes(p)) return true;
    const pWords = p.split(" ");
    const ingWords = ing.split(" ");
    return pWords.some((pw) =>
      ingWords.some((iw) => pw === iw && pw.length > 3)
    );
  });
}

export function recomputeIngredientMatch(
  ingredients: string[],
  groceries: GroceryItem[]
): {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchScore: number;
  stats: { total: number; matched: number; missing: number };
} {
  const pantryNames = groceries.map((item) => item.name.toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];

  for (const ing of ingredients) {
    if (pantryHasIngredient(ing, pantryNames)) {
      matched.push(ing);
    } else {
      missing.push(ing);
    }
  }

  const total = ingredients.length;
  const matchScore = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return {
    matchedIngredients: matched,
    missingIngredients: missing,
    matchScore,
    stats: { total, matched: matched.length, missing: missing.length },
  };
}
