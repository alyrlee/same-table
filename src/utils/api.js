const BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function searchNutrition(query) {
  return apiFetch(`/nutrition/search?q=${encodeURIComponent(query)}`);
}

export async function getFoodNutrition(fdcId) {
  return apiFetch(`/nutrition/food/${fdcId}`);
}

export async function getNaturalNutrients(query) {
  return apiFetch('/nutrition/natural', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function searchInstant(query) {
  return apiFetch(`/nutrition/instant?q=${encodeURIComponent(query)}`);
}

export async function getPantryMealSuggestions(ingredients) {
  return apiFetch('/nutrition/natural', {
    method: 'POST',
    body: JSON.stringify({ query: ingredients.join(', ') }),
  });
}
