import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import recipes from '../data/recipes';

export default function FoodCamera({ onClose }) {
  const navigate = useNavigate();
  const { isOnline } = useApp();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResults(null);
    setIsLoading(true);

    if (!isOnline) {
      setError('Food recognition requires an internet connection.');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/recognize', { method: 'POST', body: formData });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || body.error || 'Recognition failed');
      }

      const data = await res.json();
      setResults(data.classifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchClick = (label) => {
    const slug = label.toLowerCase().replace(/\s+/g, '-');
    const match = recipes[slug];
    if (match) {
      navigate(`/compare/${slug}`);
      onClose?.();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 24, maxWidth: 400,
        width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
            Snap a Dish
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)',
          }}>x</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Take or upload a photo of any dish and we'll identify it using AI.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }}
            style={{
              flex: 1, padding: '14px 16px', borderRadius: 14, border: '2px solid var(--forest)',
              background: 'var(--forest)', color: 'white', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Lato', sans-serif",
            }}
          >
            📸 Take Photo
          </button>
          <button
            onClick={() => { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); }}
            style={{
              flex: 1, padding: '14px 16px', borderRadius: 14, border: '2px solid var(--sand)',
              background: 'var(--white)', color: 'var(--charcoal)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Lato', sans-serif",
            }}
          >
            🖼️ Upload
          </button>
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Food preview"
            style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 200, objectFit: 'cover' }}
          />
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div className="chat-typing" style={{ justifyContent: 'center' }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Analyzing your dish...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--red-light)', color: 'var(--clay)', padding: '12px 16px',
            borderRadius: 12, fontSize: 13, marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
              Matches
            </p>
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => handleMatchClick(r.label)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 12, marginBottom: 6,
                  background: i === 0 ? 'var(--green-light)' : 'var(--sand)',
                  cursor: 'pointer', transition: 'transform 0.15s',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 500, textTransform: 'capitalize' }}>
                  {r.label}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: i === 0 ? 'var(--forest)' : 'var(--muted)',
                }}>
                  {Math.round(r.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
