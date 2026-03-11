import { describe, it, expect } from 'vitest';
import { classifyHealthFlags } from '../server/services/usda.js';
import { getDefaultFoodLabels } from '../server/services/clip.js';

describe('USDA Service', () => {
  describe('classifyHealthFlags', () => {
    it('should flag high calorie foods', () => {
      const flags = classifyHealthFlags({ calories: 600 });
      expect(flags.some((f) => f.label === 'High Calorie')).toBe(true);
    });

    it('should flag high fat foods', () => {
      const flags = classifyHealthFlags({ saturated_fat_g: 15 });
      expect(flags.some((f) => f.label === 'High Fat')).toBe(true);
    });

    it('should flag high sodium foods', () => {
      const flags = classifyHealthFlags({ sodium_mg: 1500 });
      expect(flags.some((f) => f.label === 'High Sodium')).toBe(true);
    });

    it('should flag good traits like high fiber', () => {
      const flags = classifyHealthFlags({ fiber_g: 8 });
      expect(flags.some((f) => f.label === 'High Fiber' && f.type === 'good')).toBe(true);
    });

    it('should flag good traits like high protein', () => {
      const flags = classifyHealthFlags({ protein_g: 30 });
      expect(flags.some((f) => f.label === 'High Protein' && f.type === 'good')).toBe(true);
    });

    it('should flag low calorie foods as good', () => {
      const flags = classifyHealthFlags({ calories: 200 });
      expect(flags.some((f) => f.label === 'Low Calorie' && f.type === 'good')).toBe(true);
    });

    it('should return multiple flags for unhealthy foods', () => {
      const flags = classifyHealthFlags({
        calories: 700,
        saturated_fat_g: 18,
        sodium_mg: 1800,
      });
      expect(flags.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle empty/zero nutrients gracefully', () => {
      const flags = classifyHealthFlags({});
      expect(Array.isArray(flags)).toBe(true);
    });
  });
});

describe('CLIP Service', () => {
  describe('getDefaultFoodLabels', () => {
    it('should return an array of food labels', () => {
      const labels = getDefaultFoodLabels();
      expect(Array.isArray(labels)).toBe(true);
      expect(labels.length).toBeGreaterThan(20);
    });

    it('should include cultural food items', () => {
      const labels = getDefaultFoodLabels();
      expect(labels).toContain('oxtail stew');
      expect(labels).toContain('jerk chicken');
      expect(labels).toContain('tamales');
      expect(labels).toContain('pernil');
      expect(labels).toContain('collard greens');
      expect(labels).toContain('gallo pinto');
    });

    it('should include foods from all target cultures', () => {
      const labels = getDefaultFoodLabels();
      // Jamaican
      expect(labels.some((l) => l.includes('jerk'))).toBe(true);
      // Puerto Rican
      expect(labels.some((l) => l.includes('mofongo'))).toBe(true);
      // Central American
      expect(labels.some((l) => l.includes('pupusas'))).toBe(true);
      // Soul Food
      expect(labels.some((l) => l.includes('fried chicken'))).toBe(true);
      // West African
      expect(labels.some((l) => l.includes('jollof'))).toBe(true);
      // Haitian
      expect(labels.some((l) => l.includes('griot'))).toBe(true);
    });

    it('should return a copy (not a reference to internal state)', () => {
      const labels1 = getDefaultFoodLabels();
      const labels2 = getDefaultFoodLabels();
      expect(labels1).not.toBe(labels2);
      expect(labels1).toEqual(labels2);
    });
  });
});
