import { searchFoods, classifyHealthFlags } from './usda.js';

// ─── TheMealDB (free, no key, Creative Commons) ───
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Cultural area mappings for MealDB categories
const CULTURE_MAP = {
  Jamaican: 'Jamaican',
  Mexican: 'Central American',
  American: 'Soul Food',
  Cuban: 'Caribbean',
  Portuguese: 'Caribbean',
  Trinidadian: 'Caribbean',
  Haitian: 'Haitian',
};

export async function scrapeMealDB() {
  const recipes = [];

  // Fetch by relevant areas
  const areas = ['Jamaican', 'Mexican', 'American', 'Cuban'];

  for (const area of areas) {
    try {
      const listRes = await fetch(`${MEALDB_BASE}/filter.php?a=${area}`);
      const listData = await listRes.json();
      const meals = listData.meals || [];

      for (const meal of meals.slice(0, 25)) { // Limit per area
        try {
          const detailRes = await fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`);
          const detailData = await detailRes.json();
          const m = detailData.meals?.[0];
          if (!m) continue;

          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = m[`strIngredient${i}`];
            const measure = m[`strMeasure${i}`];
            if (ing && ing.trim()) {
              ingredients.push(`${(measure || '').trim()} ${ing.trim()}`.trim());
            }
          }

          recipes.push({
            id: `mealdb-${m.idMeal}`,
            name: m.strMeal,
            culture: CULTURE_MAP[m.strArea] || m.strArea,
            category: m.strCategory,
            description: m.strMeal,
            ingredients,
            instructions: m.strInstructions
              ? m.strInstructions.split(/\r?\n/).filter((s) => s.trim())
              : [],
            image_url: m.strMealThumb,
            source: 'themealdb',
            source_url: m.strSource || null,
            youtube_url: m.strYoutube || null,
            tags: m.strTags ? m.strTags.split(',').map((t) => t.trim()) : [],
          });

          // Rate limit: small delay between requests
          await sleep(200);
        } catch (err) {
          console.warn(`Failed to fetch MealDB detail for ${meal.idMeal}: ${err.message}`);
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch MealDB area ${area}: ${err.message}`);
    }
  }

  // Also search by category keywords
  const keywords = ['chicken', 'rice', 'beans', 'pork', 'beef', 'plantain', 'yam', 'fish'];
  for (const keyword of keywords) {
    try {
      const res = await fetch(`${MEALDB_BASE}/search.php?s=${keyword}`);
      const data = await res.json();
      const meals = data.meals || [];

      for (const m of meals) {
        // Skip if already have it
        if (recipes.some((r) => r.id === `mealdb-${m.idMeal}`)) continue;

        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing = m[`strIngredient${i}`];
          const measure = m[`strMeasure${i}`];
          if (ing && ing.trim()) {
            ingredients.push(`${(measure || '').trim()} ${ing.trim()}`.trim());
          }
        }

        recipes.push({
          id: `mealdb-${m.idMeal}`,
          name: m.strMeal,
          culture: CULTURE_MAP[m.strArea] || m.strArea,
          category: m.strCategory,
          description: m.strMeal,
          ingredients,
          instructions: m.strInstructions
            ? m.strInstructions.split(/\r?\n/).filter((s) => s.trim())
            : [],
          image_url: m.strMealThumb,
          source: 'themealdb',
          source_url: m.strSource || null,
          youtube_url: m.strYoutube || null,
          tags: m.strTags ? m.strTags.split(',').map((t) => t.trim()) : [],
        });
      }
      await sleep(200);
    } catch (err) {
      console.warn(`Failed MealDB keyword search for ${keyword}: ${err.message}`);
    }
  }

  return recipes;
}

// ─── Open Food Facts (free, open data) ───
const OFF_BASE = 'https://world.openfoodfacts.org';

export async function scrapeOpenFoodFacts(categories = ['plantain', 'black-beans', 'rice', 'chicken', 'pork'], limit = 10) {
  const foods = [];

  for (const category of categories) {
    try {
      const res = await fetch(
        `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(category)}&search_simple=1&action=process&json=1&page_size=${limit}`
      );
      const data = await res.json();

      for (const product of data.products || []) {
        const n = product.nutriments || {};
        foods.push({
          id: `off-${product.code || product._id}`,
          name: product.product_name || category,
          brand: product.brands || null,
          image_url: product.image_url || null,
          nutrients: {
            calories: n['energy-kcal_100g'] || 0,
            total_fat_g: n.fat_100g || 0,
            saturated_fat_g: n['saturated-fat_100g'] || 0,
            carbs_g: n.carbohydrates_100g || 0,
            sugars_g: n.sugars_100g || 0,
            fiber_g: n.fiber_100g || 0,
            protein_g: n.proteins_100g || 0,
            sodium_mg: (n.sodium_100g || 0) * 1000,
          },
          per: '100g',
          source: 'openfoodfacts',
        });
      }
      await sleep(300);
    } catch (err) {
      console.warn(`Failed OFF search for ${category}: ${err.message}`);
    }
  }

  return foods;
}

// ─── Enrich recipes with USDA nutrition data ───
export async function enrichWithUSDA(recipes) {
  const enriched = [];

  for (const recipe of recipes) {
    try {
      // Search USDA for the dish name
      const usdaResults = await searchFoods(recipe.name, 1);
      if (usdaResults.length > 0) {
        recipe.nutrition = usdaResults[0].nutrients;
        recipe.usda_fdcId = usdaResults[0].fdcId;
        recipe.health_tags = classifyHealthFlags(recipe.nutrition);
      }
    } catch {
      // USDA lookup failed — skip enrichment for this recipe
    }

    recipe.embedding_ready = !!(recipe.name && recipe.ingredients?.length > 0 && recipe.image_url);
    enriched.push(recipe);

    // Rate limit USDA calls
    await sleep(400);
  }

  return enriched;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
