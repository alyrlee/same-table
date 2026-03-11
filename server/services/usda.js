const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

function getApiKey() {
  return process.env.USDA_API_KEY || 'DEMO_KEY';
}

export async function searchFoods(query, pageSize = 10) {
  const url = `${USDA_BASE}/foods/search?api_key=${getApiKey()}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);
  const data = await res.json();
  return data.foods.map(normalizeFoodItem);
}

export async function getFoodDetails(fdcId) {
  const url = `${USDA_BASE}/food/${fdcId}?api_key=${getApiKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA food detail failed: ${res.status}`);
  const data = await res.json();
  return normalizeFoodDetail(data);
}

export async function getFoodsByIds(fdcIds) {
  const url = `${USDA_BASE}/foods?api_key=${getApiKey()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fdcIds }),
  });
  if (!res.ok) throw new Error(`USDA foods batch failed: ${res.status}`);
  return res.json();
}

// Nutrient IDs: 1008=Energy, 1003=Protein, 1004=Fat, 1005=Carbs, 1079=Fiber, 1093=Sodium, 1258=Sat Fat
const NUTRIENT_MAP = {
  1008: { key: 'calories', unit: 'kcal' },
  1003: { key: 'protein_g', unit: 'g' },
  1004: { key: 'total_fat_g', unit: 'g' },
  1005: { key: 'carbs_g', unit: 'g' },
  1079: { key: 'fiber_g', unit: 'g' },
  1093: { key: 'sodium_mg', unit: 'mg' },
  1258: { key: 'saturated_fat_g', unit: 'g' },
  1253: { key: 'cholesterol_mg', unit: 'mg' },
  1087: { key: 'calcium_mg', unit: 'mg' },
  1089: { key: 'iron_mg', unit: 'mg' },
  1092: { key: 'potassium_mg', unit: 'mg' },
  1104: { key: 'vitamin_a_mcg', unit: 'mcg' },
  1162: { key: 'vitamin_c_mg', unit: 'mg' },
};

function extractNutrients(foodNutrients) {
  const result = {};
  for (const fn of foodNutrients || []) {
    const id = fn.nutrient?.id || fn.nutrientId;
    const mapping = NUTRIENT_MAP[id];
    if (mapping) {
      result[mapping.key] = fn.amount || fn.value || 0;
    }
  }
  return result;
}

function normalizeFoodItem(food) {
  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || null,
    dataType: food.dataType,
    nutrients: extractNutrients(food.foodNutrients),
  };
}

function normalizeFoodDetail(food) {
  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || null,
    dataType: food.dataType,
    category: food.foodCategory?.description || null,
    ingredients: food.ingredients || null,
    servingSize: food.servingSize || null,
    servingSizeUnit: food.servingSizeUnit || null,
    nutrients: extractNutrients(food.foodNutrients),
    labelNutrients: food.labelNutrients || null,
  };
}

export function classifyHealthFlags(nutrients) {
  const flags = [];
  if (nutrients.calories > 500) flags.push({ label: 'High Calorie', type: 'warn' });
  if (nutrients.saturated_fat_g > 10) flags.push({ label: 'High Fat', type: 'warn' });
  if (nutrients.sodium_mg > 1200) flags.push({ label: 'High Sodium', type: 'warn' });
  if (nutrients.fiber_g > 5) flags.push({ label: 'High Fiber', type: 'good' });
  if (nutrients.protein_g > 25) flags.push({ label: 'High Protein', type: 'good' });
  if (nutrients.calories < 300) flags.push({ label: 'Low Calorie', type: 'good' });
  return flags;
}
