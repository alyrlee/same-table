import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import { mealSuggestions } from '../data/recipes';
import { getNaturalNutrients, searchInstant } from '../utils/api';

export default function Pantry() {
  const navigate = useNavigate();
  const { t, isOnline, pantryItems, addPantryItem, removePantryItem } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState(null);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [autocomplete, setAutocomplete] = useState([]);

  const handleAdd = () => {
    const val = inputVal.trim();
    if (!val) return;
    addPantryItem(val);
    setInputVal('');
    setShowSuggestions(false);
    setAutocomplete([]);
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (isOnline && val.trim().length >= 2) {
      try {
        const results = await searchInstant(val.trim());
        setAutocomplete((results?.common || []).slice(0, 5));
      } catch {
        setAutocomplete([]);
      }
    } else {
      setAutocomplete([]);
    }
  };

  const selectAutocomplete = (item) => {
    addPantryItem(item.food_name || item.name || item);
    setInputVal('');
    setAutocomplete([]);
  };

  const handleFindMeals = async () => {
    setShowSuggestions(true);
    setLoadingMeals(true);
    setLiveSuggestions(null);

    if (isOnline && pantryItems.length > 0) {
      try {
        const query = pantryItems.map((i) => `1 serving ${i.name}`).join(', ');
        const foods = await getNaturalNutrients(query);
        if (foods && foods.length > 0) {
          const mapped = foods.map((f, idx) => ({
            id: `live-${idx}`,
            emoji: '🥗',
            name: f.food_name || f.name || 'Ingredient',
            detail: `${Math.round(f.calories || f.nf_calories || 0)} cal · ${Math.round(f.protein_g || f.nf_protein || 0)}g protein`,
            score: Math.min(100, Math.max(10, 100 - Math.round((f.calories || f.nf_calories || 300) / 8))),
          }));
          setLiveSuggestions(mapped);
        }
      } catch {
        // Fall through to offline suggestions
      }
    }

    setLoadingMeals(false);
  };

  const suggestions = liveSuggestions || mealSuggestions;

  return (
    <div className="page-content">
      <div className="pantry-wrap">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← {t('back_browse')}
        </button>
        <div className="pantry-title">{t('pantry_title')}</div>
        <div className="pantry-sub">{t('pantry_sub')}</div>
        <div className="pantry-input-row" style={{ position: 'relative' }}>
          <input
            type="text"
            className="pantry-input"
            placeholder={t('pantry_placeholder')}
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-add" onClick={handleAdd}>
            {t('add_btn')}
          </button>
          {autocomplete.length > 0 && (
            <div className="autocomplete-dropdown">
              {autocomplete.map((item, i) => (
                <button
                  key={i}
                  className="autocomplete-item"
                  onClick={() => selectAutocomplete(item)}
                >
                  {item.food_name || item.name || item}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pantry-grid">
          {pantryItems.map((item) => (
            <div key={item.id} className="pantry-chip">
              {item.emoji} {item.name}
              <button className="chip-remove" onClick={() => removePantryItem(item.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="btn-find-meals" onClick={handleFindMeals}>
          🍽️ {t('find_meals')} →
        </button>

        {showSuggestions && (
          <div>
            <div className="suggestion-title">
              {t('suggestions_title')}
              {liveSuggestions && <span className="live-tag" style={{ marginLeft: 8 }}>📡 Live</span>}
            </div>
            {loadingMeals ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
                Loading nutrition data...
              </div>
            ) : (
              suggestions.map((meal) => (
                <div
                  key={meal.id}
                  className="suggestion-card"
                  onClick={() => meal.recipeId && navigate(`/compare/${meal.recipeId}`)}
                >
                  <div className="suggestion-emoji">{meal.emoji}</div>
                  <div className="suggestion-info">
                    <h4>{meal.name}</h4>
                    <p>{meal.detail}</p>
                  </div>
                  <div className="health-score">
                    {meal.score}
                    <span>health score</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
