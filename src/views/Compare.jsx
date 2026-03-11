import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import recipes from '../data/recipes';
import { searchNutrition } from '../utils/api';

function NutritionBar({ label, value, pct, level, change }) {
  return (
    <div className="nutrition-row">
      <div className="nutrition-label">
        <span>{label}</span>
        <span style={change ? { color: 'var(--forest)' } : undefined}>
          {value}{change ? ` ${change}` : ''}
        </span>
      </div>
      <div className="nutrition-bar">
        <div className={`nutrition-fill fill-${level}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LiveNutritionBadge({ loading, hasLive }) {
  if (loading) return <span className="live-badge loading">⏳ Verifying via USDA...</span>;
  if (hasLive) return <span className="live-badge verified">✅ USDA Verified</span>;
  return null;
}

export default function Compare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isOnline } = useApp();

  const recipe = recipes[id] || recipes.oxtail;
  const { original, healthier } = recipe;

  const [liveNutrition, setLiveNutrition] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;
    setLiveLoading(true);

    searchNutrition(recipe.name)
      .then((data) => {
        if (cancelled) return;
        if (data?.foods?.length > 0) {
          setLiveNutrition(data.foods[0]);
        }
      })
      .catch(() => { /* offline or API error — use local data */ })
      .finally(() => { if (!cancelled) setLiveLoading(false); });

    return () => { cancelled = true; };
  }, [recipe.name, isOnline]);

  const displayCalories = liveNutrition?.nutrients?.calories
    ? Math.round(liveNutrition.nutrients.calories)
    : original.calories;

  return (
    <div className="page-content">
      <div className="compare-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← {t('back_browse')}
        </button>
        <div className="compare-title">{recipe.name}</div>
        <div className="compare-subtitle">
          {recipe.culture} • {recipe.tags.map((tag) => tag.label).join(', ')}
        </div>
      </div>

      <div className="improvement-banner">
        <div className="improvement-icon">💚</div>
        <div className="improvement-text">
          <h4>{healthier.improvement || t('improvement_h')}</h4>
          <p>{healthier.improvementDetail || t('improvement_p')}</p>
        </div>
      </div>

      <div className="compare-grid">
        {/* Original */}
        <div className="recipe-card">
          <div className="recipe-card-header">
            <span className="recipe-label label-original">{t('original_label')}</span>
            <LiveNutritionBadge loading={liveLoading} hasLive={!!liveNutrition} />
          </div>
          <div className="recipe-card-body">
            <div className="recipe-img">{recipe.emoji}</div>
            <h3>{original.name}</h3>
            <div className="recipe-meta">
              <div className="meta-item">
                <strong>{displayCalories}</strong> {t('cal_serving')}
              </div>
              <div className="meta-item">
                <strong>{original.time}</strong>
              </div>
              <div className="meta-item">
                <strong>{original.servings}</strong> {t('servings')}
              </div>
            </div>
            <div className="nutrition-section">
              <div className="nutrition-title">{t('nutrition')}</div>
              {original.nutrition.map((n, i) => (
                <NutritionBar key={i} {...n} />
              ))}
            </div>
            <div className="nutrition-title" style={{ marginBottom: 10 }}>{t('ingredients')}</div>
            <ul className="ingredient-list">
              {original.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Healthier */}
        <div className="recipe-card">
          <div className="recipe-card-header">
            <span className="recipe-label label-healthier">✨ {t('healthier_label')}</span>
          </div>
          <div className="recipe-card-body">
            <div className="recipe-img" style={{ background: 'var(--green-light)' }}>{recipe.emoji}</div>
            <h3>{healthier.name}</h3>
            <div className="recipe-meta">
              <div className="meta-item">
                <strong style={{ color: 'var(--forest)' }}>{healthier.calories}</strong> {t('cal_serving')}
              </div>
              <div className="meta-item">
                <strong>{healthier.time}</strong>
              </div>
              <div className="meta-item">
                <strong>{healthier.servings}</strong> {t('servings')}
              </div>
            </div>
            <div className="nutrition-section">
              <div className="nutrition-title">{t('nutrition')}</div>
              {healthier.nutrition.map((n, i) => (
                <NutritionBar key={i} {...n} />
              ))}
            </div>
            <div className="nutrition-title" style={{ marginBottom: 10 }}>{t('swapped_ingredients')}</div>
            <ul className="ingredient-list">
              {healthier.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.text}
                  {ing.swap && <span className="sub-badge">{ing.swap}</span>}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16 }}>
              <div className="nutrition-title" style={{ marginBottom: 10 }}>{t('instructions')}</div>
              <ol className="steps-list">
                {healthier.steps.map((step, i) => (
                  <li key={i} className="step-item">
                    <span className="step-num">{i + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="healthify-banner">
        <div>
          <h3>{t('healthify_h')}</h3>
          <p>{t('healthify_p')}</p>
        </div>
        <button className="btn-healthify">✨ {t('healthify_btn')}</button>
      </div>
    </div>
  );
}
