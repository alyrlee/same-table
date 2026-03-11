import { describe, it, expect } from 'vitest';
import recipes, { cultures, chatResponses, mealSuggestions } from '../src/data/recipes.js';
import i18n from '../src/data/i18n.js';

describe('Recipe Data Integrity', () => {
  const recipeList = Object.values(recipes);

  it('should have at least 6 recipes', () => {
    expect(recipeList.length).toBeGreaterThanOrEqual(6);
  });

  it('every recipe should have required fields', () => {
    for (const recipe of recipeList) {
      expect(recipe.id).toBeDefined();
      expect(recipe.emoji).toBeDefined();
      expect(recipe.culture).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.description).toBeDefined();
      expect(recipe.tags).toBeDefined();
      expect(Array.isArray(recipe.tags)).toBe(true);
      expect(recipe.original).toBeDefined();
      expect(recipe.healthier).toBeDefined();
    }
  });

  it('every original recipe should have nutrition data', () => {
    for (const recipe of recipeList) {
      const { original } = recipe;
      expect(original.calories).toBeGreaterThan(0);
      expect(original.nutrition).toBeDefined();
      expect(original.nutrition.length).toBeGreaterThanOrEqual(3);
      expect(original.ingredients).toBeDefined();
      expect(original.ingredients.length).toBeGreaterThan(0);
    }
  });

  it('every healthier recipe should have lower calories than original', () => {
    for (const recipe of recipeList) {
      expect(recipe.healthier.calories).toBeLessThan(recipe.original.calories);
    }
  });

  it('every healthier recipe should have cooking steps', () => {
    for (const recipe of recipeList) {
      expect(recipe.healthier.steps).toBeDefined();
      expect(recipe.healthier.steps.length).toBeGreaterThan(0);
    }
  });

  it('every tag should have a label and type', () => {
    for (const recipe of recipeList) {
      for (const tag of recipe.tags) {
        expect(tag.label).toBeDefined();
        expect(['warn', 'good']).toContain(tag.type);
      }
    }
  });
});

describe('i18n Translations', () => {
  const requiredLangs = ['en', 'es', 'pt', 'fr'];
  const requiredKeys = [
    'tagline', 'hero_h1_1', 'hero_p', 'search_btn', 'my_pantry',
    'nav_home', 'nav_search', 'nav_pantry', 'nav_saved', 'nav_profile',
    'see_alts', 'back_browse', 'original_label', 'healthier_label',
    'chat_greeting', 'offline_banner',
  ];

  for (const lang of requiredLangs) {
    it(`should have ${lang} translations`, () => {
      expect(i18n[lang]).toBeDefined();
    });

    it(`${lang} should have all required keys`, () => {
      for (const key of requiredKeys) {
        expect(i18n[lang][key], `Missing ${lang}.${key}`).toBeDefined();
        expect(i18n[lang][key].length).toBeGreaterThan(0);
      }
    });
  }

  it('English should be the most complete translation', () => {
    const enKeys = Object.keys(i18n.en);
    for (const lang of ['es', 'pt', 'fr']) {
      const langKeys = Object.keys(i18n[lang]);
      // Other languages should have at least 80% of English keys
      expect(langKeys.length).toBeGreaterThanOrEqual(Math.floor(enKeys.length * 0.8));
    }
  });
});

describe('Cultures', () => {
  it('should have an "all" option', () => {
    expect(cultures.find((c) => c.id === 'all')).toBeDefined();
  });

  it('should have at least 5 cultural categories', () => {
    expect(cultures.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Chat Responses', () => {
  it('should have responses for all supported languages', () => {
    for (const lang of ['en', 'es', 'pt', 'fr']) {
      expect(chatResponses[lang]).toBeDefined();
      expect(chatResponses[lang].length).toBeGreaterThan(0);
    }
  });
});

describe('Meal Suggestions', () => {
  it('should have at least 3 suggestions', () => {
    expect(mealSuggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('every suggestion should have required fields', () => {
    for (const meal of mealSuggestions) {
      expect(meal.id).toBeDefined();
      expect(meal.emoji).toBeDefined();
      expect(meal.name).toBeDefined();
      expect(meal.score).toBeGreaterThan(0);
      expect(meal.score).toBeLessThanOrEqual(100);
    }
  });
});
