import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';

export default function Submit() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [form, setForm] = useState({
    name: '',
    culture: '',
    description: '',
    ingredients: '',
    instructions: '',
    agreed: false,
  });
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const cultures = [
    'Jamaican', 'Puerto Rican', 'Dominican', 'Central American',
    'Soul Food', 'West African', 'Haitian', 'Costa Rican', 'Cuban',
    'Trinidadian', 'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreed) {
      setStatus({ type: 'error', msg: 'Please agree to the terms before submitting.' });
      return;
    }
    if (!form.name || !form.ingredients || !form.instructions) {
      setStatus({ type: 'error', msg: 'Please fill in name, ingredients, and instructions.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('culture', form.culture);
      formData.append('description', form.description);
      formData.append('ingredients', JSON.stringify(form.ingredients.split('\n').filter(Boolean)));
      formData.append('instructions', JSON.stringify(form.instructions.split('\n').filter(Boolean)));
      if (photo) formData.append('photo', photo);

      const token = localStorage.getItem('hh-token');
      const res = await fetch('/api/community/submit', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Submission failed');
      }

      setStatus({ type: 'success', msg: 'Recipe submitted! Thank you for sharing your family recipe with the community.' });
      setForm({ name: '', culture: '', description: '', ingredients: '', instructions: '', agreed: false });
      setPhoto(null);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="pantry-wrap">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← {t('back_browse')}
        </button>

        <div className="pantry-title">Share a Family Recipe</div>
        <div className="pantry-sub">
          Contribute your family's recipes to help build a healthier future for our communities.
          Every recipe helps us represent our cultures' food correctly.
        </div>

        {status && (
          <div style={{
            background: status.type === 'success' ? 'var(--green-light)' : 'var(--red-light)',
            color: status.type === 'success' ? 'var(--forest)' : 'var(--clay)',
            padding: '14px 18px', borderRadius: 14, marginBottom: 20, fontSize: 14,
          }}>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Dish Name *</label>
          <input
            className="pantry-input"
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="e.g. Grandma's Oxtail Stew"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label style={labelStyle}>Culture / Origin</label>
          <select
            className="pantry-input"
            style={{ width: '100%', marginBottom: 16 }}
            value={form.culture}
            onChange={(e) => setForm({ ...form, culture: e.target.value })}
          >
            <option value="">Select a culture...</option>
            {cultures.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label style={labelStyle}>Description</label>
          <textarea
            className="pantry-input"
            style={{ width: '100%', marginBottom: 16, minHeight: 60, resize: 'vertical' }}
            placeholder="Tell us the story behind this dish..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label style={labelStyle}>Ingredients * (one per line)</label>
          <textarea
            className="pantry-input"
            style={{ width: '100%', marginBottom: 16, minHeight: 120, resize: 'vertical' }}
            placeholder={"2 lbs oxtail\n3 cloves garlic\n1 scotch bonnet pepper\n..."}
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
          />

          <label style={labelStyle}>Cooking Instructions * (one step per line)</label>
          <textarea
            className="pantry-input"
            style={{ width: '100%', marginBottom: 16, minHeight: 120, resize: 'vertical' }}
            placeholder={"Season the oxtail with allspice and garlic.\nBrown in a dutch oven over high heat.\n..."}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />

          <label style={labelStyle}>Photo of the Dish</label>
          <input
            type="file"
            accept="image/*"
            style={{ marginBottom: 20, fontSize: 14 }}
            onChange={(e) => setPhoto(e.target.files[0])}
          />

          <div style={{
            background: 'var(--sand)', borderRadius: 14, padding: '14px 18px',
            marginBottom: 20, fontSize: 12, lineHeight: 1.6, color: 'var(--muted)',
          }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              <span>
                I agree that my submitted recipe may be included in the Health + Heritage open dataset
                for research and app improvement. I confirm this is my own recipe or I have permission to share it.
                See our <a href="/terms" style={{ color: 'var(--forest)' }}>Terms of Service</a> and{' '}
                <a href="/privacy" style={{ color: 'var(--forest)' }}>Privacy Policy</a>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-find-meals"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Submitting...' : '🍽️ Submit My Recipe'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  marginBottom: 6,
};
