const NUTRITIONIX_BASE = 'https://trackapi.nutritionix.com/v2';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-app-id': process.env.NUTRITIONIX_APP_ID || '',
    'x-app-key': process.env.NUTRITIONIX_APP_KEY || '',
  };
}

function isConfigured() {
  return !!(process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY);
}

export async function getNaturalNutrients(query) {
  if (!isConfigured()) {
    throw new Error('Nutritionix API credentials not configured');
  }

  const res = await fetch(`${NUTRITIONIX_BASE}/natural/nutrients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Nutritionix nutrients failed: ${res.status} — ${errBody}`);
  }

  const data = await res.json();
  return (data.foods || []).map(normalizeFood);
}

export async function searchInstant(query) {
  if (!isConfigured()) {
    throw new Error('Nutritionix API credentials not configured');
  }

  const res = await fetch(`${NUTRITIONIX_BASE}/search/instant?query=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Nutritionix search failed: ${res.status}`);
  const data = await res.json();

  return {
    common: (data.common || []).map((f) => ({
      name: f.food_name,
      photo: f.photo?.thumb || null,
      tag_id: f.tag_id,
    })),
    branded: (data.branded || []).map((f) => ({
      name: f.food_name,
      brand: f.brand_name_item_name,
      photo: f.photo?.thumb || null,
      nix_item_id: f.nix_item_id,
    })),
  };
}

export async function getItemById(nixItemId) {
  if (!isConfigured()) {
    throw new Error('Nutritionix API credentials not configured');
  }

  const res = await fetch(`${NUTRITIONIX_BASE}/search/item?nix_item_id=${nixItemId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Nutritionix item failed: ${res.status}`);
  const data = await res.json();
  return (data.foods || []).map(normalizeFood);
}

function normalizeFood(food) {
  return {
    name: food.food_name,
    brand: food.brand_name || null,
    serving_qty: food.serving_qty,
    serving_unit: food.serving_unit,
    serving_weight_g: food.serving_weight_grams,
    nutrients: {
      calories: food.nf_calories || 0,
      total_fat_g: food.nf_total_fat || 0,
      saturated_fat_g: food.nf_saturated_fat || 0,
      cholesterol_mg: food.nf_cholesterol || 0,
      sodium_mg: food.nf_sodium || 0,
      carbs_g: food.nf_total_carbohydrate || 0,
      fiber_g: food.nf_dietary_fiber || 0,
      sugars_g: food.nf_sugars || 0,
      protein_g: food.nf_protein || 0,
      potassium_mg: food.nf_potassium || 0,
    },
    photo: food.photo?.highres || food.photo?.thumb || null,
  };
}

export { isConfigured };
