import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { Exercise } from '../../types/workout';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

const DIFFICULTY_STYLE: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  intermediate: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  advanced:     { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
};

const sectionLabel: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--faint)',
  letterSpacing: '1.5px', textTransform: 'uppercase',
  marginBottom: 8, display: 'block',
};

const muscleChip: CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--text3)',
};

const frostedCircle: CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
  border: 'none', cursor: 'pointer', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

const IconDumbbell = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 8h12v8H6z"/>
  </svg>
);

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
  zIndex?: number;
}

export const ExerciseModal = ({ exercise, onClose, zIndex = 50 }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [techniqueIdx, setTechniqueIdx] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const prevExerciseIdRef = useRef<string | undefined>(undefined);
  if (prevExerciseIdRef.current !== exercise?.id) {
    prevExerciseIdRef.current = exercise?.id;
    if (techniqueIdx !== 0) setTechniqueIdx(0);
  }

  const isLightboxOpen = (location.state as { lightbox?: boolean } | null)?.lightbox === true;

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    // Сохраняем modal:'exercise', чтобы ExerciseGrid не закрыл модалку
    navigate('.', { state: { modal: 'exercise', lightbox: true } });
  };

  const closeLightbox = () => navigate(-1);

  if (!exercise) return null;

  const techniques: string[] = Array.isArray(exercise.images?.technique)
    ? exercise.images.technique.filter(Boolean)
    : [];
  const muscleMap = exercise.images?.muscleMap || null;
  const hasDescription = Boolean(exercise.description?.trim());
  const hasMuscles = (exercise.targetMuscles?.length ?? 0) > 0;
  const diffStyle = exercise.difficulty ? (DIFFICULTY_STYLE[exercise.difficulty] ?? null) : null;
  const heroSrc = exercise.images?.cover || techniques[0] || null;
  const multiTechnique = techniques.length > 1;

  const prevTechnique = () => setTechniqueIdx(i => Math.max(i - 1, 0));
  const nextTechnique = () => setTechniqueIdx(i => Math.min(i + 1, techniques.length - 1));

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .ex-modal-panel {
            max-width: 520px !important;
            border-radius: 20px !important;
            max-height: 90dvh !important;
            height: auto !important;
          }
          .ex-modal-backdrop {
            align-items: center !important;
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="ex-modal-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Panel */}
        <div
          className="ex-modal-panel"
          style={{ width: '100%', height: '100dvh', overflowY: 'auto', background: 'var(--bg)', position: 'relative' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Hero image */}
          <div style={{ position: 'relative', height: 260, background: 'var(--surface3)', overflow: 'hidden', flexShrink: 0 }}>
            {heroSrc ? (
              <img src={heroSrc} alt={exercise.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconDumbbell />
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
              background: 'linear-gradient(to top, var(--bg) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 60 }}>
              <h2 style={{
                fontSize: 24, fontWeight: 700, color: '#ffffff', margin: 0,
                lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}>
                {exercise.name}
              </h2>
            </div>
            <button onClick={onClose} style={{ ...frostedCircle, position: 'absolute', top: 14, right: 14 }}>
              <IconClose />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 16px 40px' }}>

            {/* Badges */}
            {(exercise.difficulty || exercise.equipment) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {exercise.difficulty && diffStyle && (
                  <span style={{
                    background: diffStyle.bg, color: diffStyle.color,
                    borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                  }}>
                    {DIFFICULTY_LABEL[exercise.difficulty] ?? exercise.difficulty}
                  </span>
                )}
                {exercise.equipment && (
                  <span style={{
                    background: 'var(--accent-a10)', color: 'var(--accent)',
                    borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                  }}>
                    {exercise.equipment}
                  </span>
                )}
              </div>
            )}

            {/* Target muscles */}
            {hasMuscles && (
              <div style={{ marginBottom: 20 }}>
                <span style={sectionLabel}>Целевые мышцы</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {exercise.targetMuscles.map(m => (
                    <span key={m} style={muscleChip}>{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {hasDescription && (
              <div style={{ marginBottom: 20 }}>
                <span style={sectionLabel}>Описание</span>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {exercise.description}
                </p>
              </div>
            )}

            {/* Technique carousel */}
            {techniques.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span style={sectionLabel}>Техника выполнения</span>

                <div style={{ position: 'relative', borderRadius: 12 }}>
                  <img
                    src={techniques[techniqueIdx]}
                    alt={`Техника ${techniqueIdx + 1}`}
                    onClick={() => openLightbox(techniques[techniqueIdx])}
                    onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={e => {
                      const delta = e.changedTouches[0].clientX - touchStartX.current;
                      if (delta < -50) nextTechnique();
                      if (delta > 50) prevTechnique();
                    }}
                    style={{
                      width: '100%', aspectRatio: '4 / 3', objectFit: 'contain',
                      background: 'var(--surface3)', display: 'block', cursor: 'zoom-in',
                    }}
                  />

                  {multiTechnique && techniqueIdx > 0 && (
                    <button
                      onClick={prevTechnique}
                      style={{ ...frostedCircle, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <IconChevronLeft />
                    </button>
                  )}
                  {multiTechnique && techniqueIdx < techniques.length - 1 && (
                    <button
                      onClick={nextTechnique}
                      style={{ ...frostedCircle, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <IconChevronRight />
                    </button>
                  )}
                </div>

                {multiTechnique && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    {techniques.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTechniqueIdx(i)}
                        style={{
                          height: 6,
                          width: i === techniqueIdx ? 18 : 6,
                          borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
                          background: i === techniqueIdx ? 'var(--accent)' : 'var(--border2)',
                          transition: 'width 200ms ease, background 200ms ease',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Muscle map */}
            {muscleMap && (
              <div style={{ marginBottom: 20 }}>
                <span style={sectionLabel}>Карта мышц</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={muscleMap} alt="Карта мышц"
                    style={{ maxWidth: 200, width: '100%', height: 'auto' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {isLightboxOpen && lightboxSrc && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: zIndex + 50,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          <img
            src={lightboxSrc}
            alt="Техника"
            style={{
              maxWidth: '100vw', maxHeight: '100vh',
              objectFit: 'contain',
              touchAction: 'pinch-zoom',
            }}
          />
          <button
            onClick={closeLightbox}
            style={{ ...frostedCircle, position: 'absolute', top: 14, right: 14 }}
          >
            <IconClose />
          </button>
        </div>
      )}
    </>
  );
};
