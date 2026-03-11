export default function Logo({ size = 42, variant = 'default' }) {
  const svgSize = size - 8;
  const color = variant === 'white' ? '#FFFFFF' : '#2D6B1A';
  const fillOpacity = variant === 'white' ? 'rgba(255,255,255,0.15)' : 'rgba(45,107,26,0.07)';
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: svgSize, height: svgSize, padding: 4 }}>
      <path d="M18 58 Q30 20 62 18 Q60 50 18 58Z" stroke={color} strokeWidth="1.5" fill={fillOpacity} />
      <line x1="28" y1="34" x2="28" y2="48" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="21" y1="41" x2="35" y2="41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
