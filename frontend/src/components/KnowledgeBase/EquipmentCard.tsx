import { useRef } from 'react';

interface Props {
  equipment: { id: string; name: string; image: string | null };
  onClick: (name: string) => void;
  exerciseCount?: number;
}

function getCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('бег') || n.includes('велос') || n.includes('эллипс') || n.includes('гребн')) return 'Кардио';
  if (n.includes('гантел') || n.includes('штан') || n.includes('гиря') || n.includes('блин')) return 'Свободные';
  if (n.includes('турн') || n.includes('брусь') || n.includes('кольц')) return 'Гимнастика';
  return 'Силовой';
}

const IconDumbbell = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 8h12v8H6z"/>
  </svg>
);

export const EquipmentCard = ({ equipment, onClick, exerciseCount }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.borderColor = 'rgba(110,231,183,0.25)';
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    if (imgRef.current) imgRef.current.style.filter = 'brightness(0.9)';
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.boxShadow = 'none';
    if (imgRef.current) imgRef.current.style.filter = 'brightness(0.75)';
  };
  const onDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(0.97)';
  };
  const onUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1.02)';
  };
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.97)';
    if (imgRef.current) imgRef.current.style.filter = 'brightness(0.9)';
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    el.style.transform = 'scale(1)';
    el.style.borderColor = 'var(--border)';
    el.style.boxShadow = 'none';
    if (imgRef.current) imgRef.current.style.filter = 'brightness(0.75)';
  };

  return (
    <div
      onClick={() => onClick(equipment.name)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        border: '1px solid var(--border)',
        transition: 'transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
      }}
    >
      {/* Image + overlays */}
      <div style={{ aspectRatio: '4 / 3', width: '100%', position: 'relative', background: 'var(--surface3)' }}>
        {equipment.image ? (
          <img
            ref={imgRef}
            src={equipment.image}
            alt={equipment.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: 'brightness(0.75)',
              transition: 'filter 150ms ease',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconDumbbell />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Top-right category pill */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          borderRadius: 999, padding: '4px 10px',
          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
          pointerEvents: 'none',
        }}>
          {getCategory(equipment.name)}
        </div>

        {/* Bottom text overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#ffffff',
            textTransform: 'uppercase', letterSpacing: '1px',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {equipment.name}
          </div>

          {exerciseCount != null && exerciseCount > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
              {exerciseCount} упражнений
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
