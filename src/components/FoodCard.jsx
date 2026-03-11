import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';

export default function FoodCard({ recipe }) {
  const navigate = useNavigate();
  const { t } = useApp();

  const handleClick = () => {
    navigate(`/compare/${recipe.id}`);
  };

  return (
    <div className="food-card" onClick={handleClick}>
      <div className="food-card-img">{recipe.emoji}</div>
      <div className="food-card-body">
        <span className="food-card-culture">{recipe.culture}</span>
        <h3>{recipe.name}</h3>
        <p>{recipe.description}</p>
        <div className="food-card-tags">
          {recipe.tags.map((tag, i) => (
            <span key={i} className={`tag tag-${tag.type}`}>{tag.label}</span>
          ))}
        </div>
        <div className="food-card-footer">
          <span className="alt-count">{recipe.altCount} {t('healthier_versions')} →</span>
          <button
            className="btn-see"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {t('see_alts')}
          </button>
        </div>
      </div>
    </div>
  );
}
