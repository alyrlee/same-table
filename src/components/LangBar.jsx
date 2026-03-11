import { useApp } from '../hooks/useAppContext';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
  { code: 'fr', label: 'FR' },
];

export default function LangBar() {
  const { lang, setLang } = useApp();

  return (
    <div className="lang-bar">
      <span className="lang-label">🌐</span>
      {langs.map((l) => (
        <button
          key={l.code}
          className={`lang-btn${lang === l.code ? ' active' : ''}`}
          onClick={() => setLang(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
