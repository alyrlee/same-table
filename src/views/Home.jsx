import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import recipes, { cultures } from '../data/recipes';
import FoodCard from '../components/FoodCard';
import FoodCamera from '../components/FoodCamera';
import Logo from '../components/Logo';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [showCamera, setShowCamera] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCulture, setActiveCulture] = useState('all');

  const recipeList = Object.values(recipes);

  const filteredRecipes = activeCulture === 'all'
    ? recipeList
    : recipeList.filter((r) => r.culture.toLowerCase().includes(activeCulture.replace(/-/g, ' ')));

  const doSearch = () => {
    const term = searchTerm.trim();
    if (!term) return;
    const slug = term.toLowerCase().replace(/\s+/g, '-');
    const match = recipes[slug];
    if (match) {
      navigate(`/compare/${slug}`);
    } else {
      // Find partial match
      const found = recipeList.find((r) =>
        r.name.toLowerCase().includes(term.toLowerCase())
      );
      if (found) {
        navigate(`/compare/${found.id}`);
      } else {
        navigate(`/compare/oxtail`);
      }
    }
  };

  const quickSearch = (term) => {
    setSearchTerm(term);
    const slug = term.toLowerCase().replace(/\s+/g, '-');
    navigate(`/compare/${slug}`);
  };

  return (
    <div className="page-content">
      {showCamera && <FoodCamera onClose={() => setShowCamera(false)} />}
      <div className="hero">
        <div className="hero-logo-wrap">
          <Logo size={74} />
        </div>
        <div className="hero-eyebrow">🌍 {t('eyebrow')}</div>
        <h1>
          {t('hero_h1_1')}<br />
          <em>{t('hero_h1_2')}</em>
        </h1>
        <p>{t('hero_p')}</p>
        <div className="search-wrap">
          <div className="search-bar">
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
            <button className="search-btn" onClick={doSearch}>
              {t('search_btn')} →
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14, position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => setShowCamera(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.3)', padding: '8px 18px',
                borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "var(--font-body, 'Lato', sans-serif)",
              }}
            >
              📸 Snap a Dish
            </button>
          </div>
          <div className="search-tags">
            {['Oxtail', 'Fried Chicken', 'Tamales', 'Mofongo', 'Gallo Pinto'].map((tag) => (
              <span key={tag} className="search-tag" onClick={() => quickSearch(tag)}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="culture-pills">
          {cultures.map((c) => (
            <span
              key={c.id}
              className={`culture-pill${activeCulture === c.id ? ' active' : ''}`}
              onClick={() => setActiveCulture(c.id)}
            >
              {c.flag ? `${c.flag} ` : ''}{c.id === 'all' ? t('all_cultures') : c.label}
            </span>
          ))}
        </div>
        <div className="section-header">
          <div className="section-title">{t('popular_dishes')}</div>
          <a className="section-link">{t('view_all')} →</a>
        </div>
        <div className="cards-grid">
          {filteredRecipes.map((recipe) => (
            <FoodCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}
